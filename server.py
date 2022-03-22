import os
import json
import logging
import random
#import boto3
#import boto3.session
import base64
import hashlib
import math
#from botocore.exceptions import ClientError
import pymysql
from flask import Flask, render_template, jsonify, abort, request, redirect, send_file, make_response
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from models import User, users

app = Flask(__name__)
app.config['SECRET_KEY'] = '8BUgFTZ-352QRSxa7Jq30yyaFWeIk2mOhOSsL3v1GB4gCHnyu0xzH2JPopp4bBuRxH0'

login_manager = LoginManager(app)
login_manager.login_view = "/login"

def open_DB_connection(rqst, variables, db_name):
    #Database connection
    DB_USER = os.getenv('HUMAINT_ANNOTATOR_DB_USER')
    DB_PWD = os.getenv('HUMAINT_ANNOTATOR_DB_PWD')
    conn = pymysql.connect(
        host='localhost',
        #host='database-1.cefjjcummrpw.eu-west-3.rds.amazonaws.com' #HOST CHANGES WHEN USING AWS INFRASTRUCTURE
        user=DB_USER,
        password=DB_PWD,
        database='humaint_annotator',
        unix_socket='/var/run/mysqld/mysqld.sock'
    )

    cursor = conn.cursor()
    result = ()
    change_distribution = False
    if rqst == "login":
        cursor.execute("SELECT user_id, username, pwd, role FROM user_info WHERE user_email=%(user_email)s", {'user_email': variables[0]})
    elif rqst == "get_img":
        inter_agreement = int(get_inter_agreement())
        if variables[1] == 'persons':
            cursor.execute("SELECT img_id, dataset, file_name FROM imgs_info WHERE dataset=%(dataset)s AND img_distribution=%(img_distribution)s AND "
                           "persons_annotated=%(inter_agreement)s AND discarded_by_user_persons IS NOT TRUE AND auto_discarded_persons IS NOT TRUE AND "
                           "is_key_frame=1", {'dataset': variables[0], 'inter_agreement': inter_agreement,
                                              'img_distribution': variables[2]}) #Number of images that have been annotated by the number
            # of inter_agreement annotators (default 3)
            result = cursor.fetchall()
            inter_agreement_quota_acquired = is_inter_agreement_quota_acquired(result, variables[0], 'persons', variables[2])
            if len(result) == 0 or not inter_agreement_quota_acquired:
                aux_inter_agreement = inter_agreement - 1
                while(aux_inter_agreement >= 0):
                    cursor.execute("SELECT img_id, dataset, file_name FROM imgs_info WHERE dataset=%(dataset)s AND img_distribution=%(img_distribution)s AND "
                                   "persons_annotated=%(aux_inter_agreement)s AND file_name NOT IN (SELECT img_name FROM img_annotator_relation LEFT JOIN "
                                   "imgs_info ii on ii.file_name=img_name where user_name=%(user_name)s and ds_type='persons') AND "
                                   "discarded_by_user_persons IS NOT TRUE AND auto_discarded_persons IS NOT TRUE AND is_key_frame=1",
                                   {'dataset': variables[0], 'aux_inter_agreement': aux_inter_agreement, 'user_name': current_user.name,
                                    'img_distribution': variables[2]}) #We select the images with less
                    # than 3 annotators and for which the current user has not participated (i.e. image of a given name in imgs_info table is not
                    # found in img_annotator_relation table)
                    result = cursor.fetchall()
                    aux_inter_agreement -= 1
                    if len(result) != 0:
                        break
            else:
                result = ()
                change_distribution = True

        elif variables[1] == 'vehicles':
            cursor.execute(
                "SELECT img_id, dataset, file_name FROM imgs_info WHERE dataset=%(dataset)s AND img_distribution=%(img_distribution)s AND "
                "vehicles_annotated=%(inter_agreement)s AND discarded_by_user_vehicles IS NOT TRUE AND auto_discarded_vehicles IS NOT TRUE AND "
                "is_key_frame=1", {'dataset': variables[0], 'inter_agreement': inter_agreement, 'img_distribution': variables[2]})  # Number of images that have been annotated by the number
            # of inter_agreement annotators (default 3)
            result = cursor.fetchall()
            inter_agreement_quota_acquired = is_inter_agreement_quota_acquired(result, variables[0], 'vehicles', variables[2])
            if len(result) == 0 or not inter_agreement_quota_acquired:
                aux_inter_agreement = inter_agreement - 1
                while (aux_inter_agreement >= 0):
                    cursor.execute("SELECT img_id, dataset, file_name FROM imgs_info WHERE dataset=%(dataset)s AND img_distribution=%(img_distribution)s AND "
                                   "vehicles_annotated=%(aux_inter_agreement)s AND file_name NOT IN (SELECT img_name FROM img_annotator_relation LEFT JOIN "
                                   "imgs_info ii on ii.file_name=img_name where user_name=%(user_name)s and ds_type='vehicles') AND "
                                   "discarded_by_user_vehicles IS NOT TRUE AND auto_discarded_vehicles IS NOT TRUE AND is_key_frame=1",
                                   {'dataset': variables[0], 'aux_inter_agreement': aux_inter_agreement, 'user_name': current_user.name,
                                    'img_distribution': variables[2]})
                    result = cursor.fetchall()
                    aux_inter_agreement -= 1
                    if len(result) != 0:
                        break
            else:
                result = ()
                change_distribution = True

    elif rqst == "get_json":
        edit_db_entry = variables[2]
        if edit_db_entry:
            if variables[1] == 'persons':
                cursor.execute("UPDATE imgs_info SET persons_annotated=persons_annotated+1 WHERE file_name=%(img_name)s", {'img_name': variables[0]})
            elif variables[1] == 'vehicles':
                cursor.execute("UPDATE imgs_info SET vehicles_annotated=vehicles_annotated+1 WHERE file_name=%(img_name)s", {'img_name': variables[0]})
            conn.commit()

        cursor.execute("SELECT associated_json FROM imgs_info WHERE file_name=%(json_file)s", {'json_file': variables[0]})
    elif rqst == "discard_img":
        if(variables[1] == "discarded-by-user"):
            if(variables[2] == "persons"):
                cursor.execute("UPDATE imgs_info SET discarded_by_user_persons=1 WHERE file_name=%(img_name)s",
                           {'img_name': variables[0]})
            else:
                cursor.execute("UPDATE imgs_info SET discarded_by_user_vehicles=1 WHERE file_name=%(img_name)s",
                               {'img_name': variables[0]})
        else:
            if (variables[2] == "persons"):
                cursor.execute("UPDATE imgs_info SET auto_discarded_persons=1 WHERE file_name=%(img_name)s",
                               {'img_name': variables[0]})
            else:
                cursor.execute("UPDATE imgs_info SET auto_discarded_vehicles=1 WHERE file_name=%(img_name)s",
                               {'img_name': variables[0]})
        conn.commit()
    elif rqst == "get_num_annotated_agents":
        if(variables[0] == "persons"):
            cursor.execute("SELECT num_annotated_agents FROM imgs_info WHERE dataset=%(ds)s and persons_annotated!=0 and img_distribution=%(imgD)s",
                           {'ds': variables[1], 'imgD': variables[2]})
        else:
            cursor.execute("SELECT num_annotated_agents FROM imgs_info WHERE dataset=%(ds)s and vehicles_annotated!=0 and img_distribution=%(imgD)s",
                           {'ds': variables[1], 'imgD': variables[2]})
    elif rqst == "new_annotation_entry":
        cursor.execute("INSERT INTO img_annotator_relation (img_name, user_name, ds_type) VALUES (%(img_name)s, %(user_name)s, %(ds_type)s);",
                       {'img_name': variables[0], 'user_name': variables[1], 'ds_type': variables[2]})
        conn.commit()
    elif rqst == "get_sweeps_jsons":
        cursor.execute("SELECT associated_json FROM imgs_info WHERE key_frame_name=%(kf_name)s AND is_key_frame=0;", {'kf_name': variables[0]})
    elif rqst == "update_sweeps":
        if variables[1] == "persons":
            cursor.execute("UPDATE imgs_info SET persons_annotated=persons_annotated+1 WHERE key_frame_name=%(kf_name)s AND is_key_frame=0;",
                           {'kf_name': variables[0]})
        elif variables[1] == "vehicles":
            cursor.execute("UPDATE imgs_info SET vehicles_annotated=vehicles_annotated+1 WHERE key_frame_name=%(kf_name)s AND is_key_frame=0;",
                           {'kf_name': variables[0]})
        conn.commit()
    elif rqst == "update_annotated_agents":
        cursor.execute("UPDATE imgs_info SET num_annotated_agents=num_annotated_agents+%(num_agents)s WHERE file_name=%(img_name)s",
                       {'img_name': variables[0], 'num_agents': variables[1]})
        conn.commit()

    if len(result) == 0 and not change_distribution:
        result = cursor.fetchall()

    conn.close()
    # Database connection closed

    return result

def create_new_annotation_entry(img_name, ds_type):
    variables = [img_name, current_user.name, ds_type]
    result = open_DB_connection('new_annotation_entry', variables, 'img_annotator_relation')

def get_inter_agreement():
    with open('config.json') as config_file:
        config = json.load(config_file)
        inter_agreement = config["inter_agreement"]
        return inter_agreement

def is_inter_agreement_quota_acquired(query_result, dataset, ds_type, distribution):
    with open('config.json') as config_file:
        config = json.load(config_file)
        inter_agreement_quota = config['num_imgs_several_annotators'][ds_type][dataset.lower()][distribution]
        if len(query_result) >= inter_agreement_quota:
            return True
        else:
            return False


def get_img(dataset, dataset_type):
    with open('config.json') as config_file:
        config = json.load(config_file)
        for dist in config['agents_to_annotate'][dataset_type][dataset]:
            variables = [dataset, dataset_type, dist]
            images = open_DB_connection("get_img", variables, 'img_info')
            if len(images) != 0:
                break
        rand_index = random.randint(0, len(images) - 1)
        img_uuid = images[rand_index][0]
        img_dataset = images[rand_index][1]
        img_file_name = images[rand_index][2]
        img = {
            "uuid": img_uuid,
            "dataset": img_dataset,
            "file_name": img_file_name
        }

    return img

@app.route('/img_url/<dataset>/<dataset_type>', methods=['GET'])
def get_img_from_storage(dataset, dataset_type):
    try:
        img = get_img(dataset, dataset_type)
        imgs_path = "/media/hector/HDD-4TB/annotator/Datasets/" + dataset + "/images"
        complete_img_path = ""
        for subdir, dirs, files in os.walk(imgs_path, onerror=walk_error_handler):
            if os.path.exists(subdir + '/' + img["file_name"]):
                complete_img_path = subdir + '/' + img["file_name"]
                break

        img_in_base64 = {}
        with open(complete_img_path, "rb") as f:
            image_binary = f.read()
            img_in_base64 = {'img': str(base64.b64encode(image_binary).decode('ascii')), 'img_name': img['file_name']}
    except Exception as e:
        logging.error(e)
        return None

    return jsonify(img_in_base64)

##### PREVIOUS METHOD CHANGES WHEN USING AWS INFRASTRUCTURE, AS FOLLOWS ######
#def get_img_url(dataset, dataset_type):
    # Creating the low level functional client
    # Credentials can be specified but it is safer to keep them in environment variables. boto3 will look for
    # AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
#    ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID')
#    SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')

#    session = boto3.session.Session(region_name='eu-west-3')
#    client = session.client(
#                        's3',
#                        config=boto3.session.Config(signature_version='s3v4'),
#                        aws_access_key_id=ACCESS_KEY,
#                        aws_secret_access_key=SECRET_KEY)

#   try:
#        img = get_img(dataset, dataset_type)
#        img_path = img["dataset"] + "/" + img["city"] + "/" + img["file_name"]
#        img_url = client.generate_presigned_url('get_object', Params={'Bucket': 'datasets-humaint',
#                                                                       'Key': img_path}, ExpiresIn=3600)
#    except ClientError as e:
#        logging.error(e)
#        return None

#    json_response = {'img_url': str(img_url), 'img_name': img["file_name"]}

#    return jsonify(json_response)

@app.route('/img_json/<dataset>/<file_name>', methods=['GET'])
def get_img_json(dataset, file_name):
    edit_db_entry = False
    variables = [file_name, "", edit_db_entry]
    json_file = str(open_DB_connection("get_json", variables, 'img_info')[0][0])
    json_data = search_json_in_datasets(json_file, dataset)

    return json_data

def search_json_in_datasets(json_file, dataset):
    # TEMPORARY TILL JSONS ARE IN STORAGE
    jsons_path = "/media/hector/HDD-4TB/annotator/Datasets/" + dataset + "/jsons"

    for subdir, dirs, files in os.walk(jsons_path, onerror=walk_error_handler):
        if os.path.exists(subdir + '/' + json_file):
            with open(subdir + '/' + json_file) as f:
                json_data = json.load(f)
                break
    else:
        abort(404)

    return json_data

@app.route('/save_edited_json/<img_name>/<dataset_type>/<annotator>/<selected_dataset>', methods=['POST'])
def save_edited_json(img_name, dataset_type, annotator, selected_dataset):
    # POST request
    edited_json = request.get_json()
    dict_of_agents = create_edited_agents(edited_json)
    edit_db_entry = True
    variables = [img_name, dataset_type, edit_db_entry]
    create_new_annotation_entry(img_name, dataset_type)
    json_file = str(open_DB_connection("get_json", variables, 'img_info')[0][0])
    list_of_sweeps_jsons = get_list_of_sweeps_jsons(img_name)

    edit_json_files(json_file, edited_json["json"], dict_of_agents, list_of_sweeps_jsons, annotator, selected_dataset)
    update_sweeps_in_db(img_name, dataset_type)

    return 'OK', 200

def update_sweeps_in_db(key_frame_name, ds_type):
    variables = [key_frame_name, ds_type]
    updated = open_DB_connection("update_sweeps", variables, "imgs_info")

def edit_json_files(json_file, edited_json, dict_of_agents, list_of_sweeps_jsons, annotator, selected_dataset):
    #First edit the key frame json
    base_path = "edited_jsons/" + selected_dataset
    if not os.path.exists(base_path):
        os.makedirs(base_path)

    key_frame_json_path = "edited_jsons/" + selected_dataset + "/" + json_file.replace('.json', '_' + annotator + '.json')
    with open(key_frame_json_path, 'w', encoding='utf-8') as f:
        json.dump(edited_json, f, ensure_ascii=False, indent=4)

    #Then edit sweeps' jsons
    for sweep in list_of_sweeps_jsons:
        sweep_json = search_json_in_datasets(sweep[0], selected_dataset)
        edited_sweep_json_path = "edited_jsons/" + selected_dataset + "/" + sweep[0].replace('.json', '_' + annotator + '.json')
        for agent in dict_of_agents:
            k = 0
            while k < len(sweep_json["agents"]):
                if sweep_json["agents"][k]['uuid'] == agent:
                    sweep_json["agents"][k] = dict_of_agents[agent]
                    break
                k += 1

        with open(edited_sweep_json_path, 'w', encoding='utf-8') as ef:
            json.dump(sweep_json, ef, ensure_ascii=False, indent=4)


def create_edited_agents(edited_json):
    dict_of_agents = {}
    for agent in edited_json["json"]["agents"]:
        dict_of_agents[agent["uuid"]] = agent

    return dict_of_agents

def get_list_of_sweeps_jsons(key_frame_name):
    variables = [key_frame_name]
    list_of_sweeps_jsons = open_DB_connection("get_sweeps_jsons", variables, 'imgs_info')
    return list_of_sweeps_jsons


@app.route('/user_credentials/<user_email>/<user_pwd>/<remember_user>', methods=['GET'])
def login(user_email, user_pwd, remember_user):
    variables = [user_email]
    db_result = open_DB_connection("login", variables, 'users')
    db_pwd = ""
    if db_result:
        db_pwd = db_result[0][2]
    encoded_pwd = user_pwd.encode()
    hashed_pwd = hashlib.sha256(encoded_pwd)
    user = User(db_result[0][0], db_result[0][1], user_email, db_pwd, db_result[0][3] == 'admin')
    users.append(user)

    if remember_user == "true":
        remember_me = True
    else:
        remember_me = False

    if hashed_pwd.hexdigest() == db_pwd:
        login_user(user, remember=remember_me)
        print("USER LOGGED IN:" + user.name)
        return "OK", 200
    else:
        return "KO", 403

@login_manager.user_loader
def load_user(user_id):
    for user in users:
        if user.id == int(user_id):
            return user
    return None

@app.route('/logout')
def logout():
    logout_user()
    return redirect('index.html')

@app.route('/discard-img/<discard_author>/<ds_type>/<img_name>', methods=['GET'])
def discard_img(img_name, discard_author, ds_type):
    variables = [img_name, discard_author, ds_type]
    db_result = open_DB_connection("discard_img", variables, 'img_info')

    return 'OK', 200

@app.route('/get_annotation_percentages', methods=['GET'])
def get_annotation_percentages():
    annotation_ptgs = {}
    annotation_ptgs['persons'] = {}
    annotation_ptgs['vehicles'] = {}

    with open('config.json') as config_file:
        config = json.load(config_file)
        for agents_type in config['agents_to_annotate']:
            for ds in config['agents_to_annotate'][agents_type]:
                sum_agents_per_dataset = 0
                num_annotated_agents = 0
                for distribution in config['agents_to_annotate'][agents_type][ds]:
                    variables = [agents_type, ds, distribution]
                    sum_agents_per_dataset += config['agents_to_annotate'][agents_type][ds][distribution]
                    annotated_agents_in_imgs = open_DB_connection("get_num_annotated_agents", variables, 'img_info')
                    for img in annotated_agents_in_imgs:
                        num_annotated_agents += img[0]

                annotation_ptgs[agents_type][ds] = math.trunc(num_annotated_agents/sum_agents_per_dataset * 100)

    return jsonify(annotation_ptgs)

@app.route('/update_annotated_agents/<img_name>/<num_agents>', methods=['GET'])
def update_annotated_agents(img_name, num_agents):
    variables = [img_name, num_agents]
    result = open_DB_connection("update_annotated_agents", variables, 'imgs_info')
    return 'OK', 200

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/<page>')
def render_page(page):
    return render_template(page)

@app.route('/login', methods=['GET'])
def render_login():
    next_page = request.args.get('next', None)#Pending solution of redirection to next_page
    return render_template("login.html")

@app.route('/annotation.html')
@login_required
def render_annotator():
    return render_template("annotation.html")

def walk_error_handler(exception_instance):
    print("The specified path is incorrect or permission is needed")

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port='5000')

