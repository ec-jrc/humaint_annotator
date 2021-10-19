import os
import json
import logging
import random
import boto3
import boto3.session
import hashlib
from botocore.exceptions import ClientError
import pymysql
from flask import Flask, render_template, jsonify, abort, request, redirect
from flask_login import LoginManager, login_user, logout_user, login_required
from models import User, users
from werkzeug.urls import url_parse

app = Flask(__name__)
app.config['SECRET_KEY'] = '8BUgFTZ-352QRSxa7Jq30yyaFWeIk2mOhOSsL3v1GB4gCHnyu0xzH2JPopp4bBuRxH0'

login_manager = LoginManager(app)
login_manager.login_view = "/login"

def open_DB_connection(rqst, variables, db_name):
    #Database connection
    DB_USER = os.getenv('HUMAINT_ANNOTATOR_DB_USER')
    DB_PWD = os.getenv('HUMAINT_ANNOTATOR_DB_PWD')
    conn = pymysql.connect(
        host='database-1.cefjjcummrpw.eu-west-3.rds.amazonaws.com',
        user=DB_USER,
        password=DB_PWD,
        database='humaint_annotator'
    )

    cursor = conn.cursor()
    if rqst == "login":
        cursor.execute("SELECT user_id, username, pwd, role FROM user_info WHERE user_email=%(user_email)s", {'user_email': variables[0]})
    elif rqst == "get_img":
        if variables[1] == 'persons':
            cursor.execute("SELECT img_id, dataset, city, file_name FROM imgs_info WHERE dataset=%(dataset)s AND persons_annotated IS NOT TRUE AND "
                           "annotated IS NOT TRUE AND discarded_by_user IS NOT TRUE AND auto_discarded IS NOT TRUE",
                           {'dataset': variables[0]})
        elif variables[1] == 'vehicles':
            cursor.execute("SELECT img_id, dataset, city, file_name FROM imgs_info WHERE dataset=%(dataset)s AND vehicles_annotated IS NOT TRUE AND "
                           "annotated IS NOT TRUE AND discarded_by_user IS NOT TRUE AND auto_discarded IS NOT TRUE",
                           {'dataset': variables[0]})

    elif rqst == "get_json":
        edit_db_entry = variables[2]
        if edit_db_entry:
            if variables[1] == 'persons':
                cursor.execute("UPDATE imgs_info SET persons_annotated=1 WHERE file_name=%(img_name)s", {'img_name': variables[0]})
                conn.commit()
            elif variables[1] == 'vehicles':
                cursor.execute("UPDATE imgs_info SET vehicles_annotated=1 WHERE file_name=%(img_name)s", {'img_name': variables[0]})
                conn.commit()

        cursor.execute("SELECT associated_json FROM imgs_info WHERE file_name=%(json_file)s", {'json_file': variables[0]})
    elif rqst == "discard_img":
        if(variables[1] == "discarded-by-user"):
            cursor.execute("UPDATE imgs_info SET discarded_by_user=1 WHERE file_name=%(img_name)s",
                       {'img_name': variables[0]})
            conn.commit()
        else:
            cursor.execute("UPDATE imgs_info SET auto_discarded=1 WHERE file_name=%(img_name)s",
                           {'img_name': variables[0]})
            conn.commit()

        cursor.execute("SELECT discarded_by_user, auto_discarded FROM imgs_info WHERE file_name=%(img_name)s",
                       {'img_name': variables[0]})
    elif rqst == "get_num_annotated_imgs":
        if(variables[0] == "persons"):
            cursor.execute("SELECT COUNT(*) FROM imgs_info WHERE dataset=%(ds)s and persons_annotated=1",
                           {'ds': variables[1]})
        else:
            cursor.execute("SELECT COUNT(*) FROM imgs_info WHERE dataset=%(ds)s and vehicles_annotated=1",
                           {'ds': variables[1]})

    result = cursor.fetchall()

    conn.close()
    # Database connection closed

    return result

def get_img(dataset, dataset_type):
    ds = "ECP" if dataset == "eurocity" else dataset
    variables = [ds, dataset_type]
    images = open_DB_connection("get_img", variables, 'img_info')
    rand_index = random.randint(0, len(images))
    img_uuid = images[rand_index][0]
    img_dataset = images[rand_index][1]
    img_city = images[rand_index][2]
    img_file_name = images[rand_index][3]
    img = {
        "uuid": img_uuid,
        "dataset": img_dataset,
        "city": img_city,
        "file_name": img_file_name
    }

    return img

@app.route('/img_url/<dataset>/<dataset_type>', methods=['GET'])
def get_img_url(dataset, dataset_type):
    # Creating the low level functional client
    # Credentials can be specified but it is safer to keep them in environment variables. boto3 will look for
    # AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
    ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID')
    SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')

    session = boto3.session.Session(region_name='eu-west-3')
    client = session.client(
                        's3',
                        config=boto3.session.Config(signature_version='s3v4'),
                        aws_access_key_id=ACCESS_KEY,
                        aws_secret_access_key=SECRET_KEY)

    try:
        img = get_img(dataset, dataset_type)
        img_path = img["dataset"] + "/" + img["city"] + "/" + img["file_name"]
        img_url = client.generate_presigned_url('get_object', Params={'Bucket': 'datasets-humaint',
                                                                       'Key': img_path}, ExpiresIn=3600)
    except ClientError as e:
        logging.error(e)
        return None

    json_response = {'img_url': str(img_url), 'img_name': img["file_name"]}

    return jsonify(json_response)

@app.route('/img_json/<dataset>/<file_name>', methods=['GET'])
def get_img_json(dataset, file_name):
    edit_db_entry = False
    variables = [file_name, "", edit_db_entry]
    json_file = str(open_DB_connection("get_json", variables, 'img_info')[0][0])

    #TEMPORARY TILL JSONS ARE IN STORAGE
    jsons_path = "annotations_json/"
    if dataset == "eurocity":
        jsons_path += "ECP/barcelona/" # Barcelona for test purposes
    elif dataset == "citypersons":
        jsons_path += "citypersons/strasbourg/"
    elif dataset == "nuscenes":
        jsons_path += "nuscenes/"
    elif dataset == "tsinghua-daimler":
        jsons_path += "tsinghua-daimler"
    elif dataset == "kitti":
        jsons_path += "kitti"
    elif dataset == "bair":
        jsons_path += "bair"

    for subdir, dirs, files in os.walk(jsons_path, onerror=walk_error_handler):
        if os.path.exists(subdir + '/' + json_file):
            with open(subdir + '/' + json_file) as f:
                json_data = json.load(f)
                break
    else:
        abort(404)

    return json_data

@app.route('/save_edited_json/<img_name>/<dataset_type>', methods=['POST'])
def save_edited_json(img_name, dataset_type):
    # POST request
    edited_json = request.get_json()
    edit_db_entry = True
    variables = [img_name, dataset_type, edit_db_entry]
    json_file = str(open_DB_connection("get_json", variables, 'img_info')[0][0])
    json_file_path = "edited_jsons/" + json_file
    with open(json_file_path, 'w', encoding='utf-8') as f:
        json.dump(edited_json, f, ensure_ascii=False, indent=4)
    return 'OK', 200

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

@app.route('/discard-img/<discard_author>/<img_name>', methods=['GET'])
def discard_img(img_name, discard_author):
    variables = [img_name, discard_author]
    db_result = open_DB_connection("discard_img", variables, 'img_info')

    return 'OK', 200

@app.route('/get_annotation_percentages', methods=['GET'])
def get_annotation_percentages():
    annotation_ptgs = {}
    annotation_ptgs['persons'] = {}
    annotation_ptgs['vehicles'] = {}
    with open('config.json') as config_file:
        config = json.load(config_file)
        for agents_type in config['images_to_annotate']:
            for ds in config['images_to_annotate'][agents_type]:
                variables = [agents_type, ds]
                num_annotated_imgs = open_DB_connection("get_num_annotated_imgs", variables, 'img_info')
                annotation_ptgs[agents_type][ds] = num_annotated_imgs[0][0]/config['images_to_annotate'][agents_type][ds] * 100

    return jsonify(annotation_ptgs)


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
    app.run(debug=False, host='0.0.0.0', port='80')

