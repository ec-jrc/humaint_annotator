import os
import json
import logging
import random
import boto3
import hashlib
from botocore.exceptions import ClientError
import pymysql
from flask import Flask, render_template, jsonify, abort, request

app = Flask(__name__)

def open_DB_connection(rqst, variables, db_name):
    #Database connection
    conn = pymysql.connect(
        host='localhost',
        user='whatever',
        password='whatever',
        database='humaint_annotator'
    )

    cursor = conn.cursor()
    if rqst == "login":
        cursor.execute("SELECT username, pwd FROM user_info WHERE user_email=%(user_email)s", {'user_email': variables[0]})
    elif rqst == "get_img":
        cursor.execute("SELECT img_id, dataset, city, file_name FROM imgs_info WHERE dataset=%(dataset)s AND annotated IS NOT TRUE AND "
                       "discarded_by_user IS NOT TRUE AND auto_discarded IS NOT TRUE",
                       {'dataset': variables[0]})
    elif rqst == "get_json":
        cursor.execute("SELECT associated_json FROM imgs_info WHERE file_name=%(json_file)s", {'json_file': variables[0]})
    elif rqst == "discard_img":
        if(variables[1] == "discarded-by-user"):
            cursor.execute("UPDATE imgs_info SET discarded_by_user=true WHERE file_name=%(img_name)s",
                       {'img_name': variables[0]})
        else:
            cursor.execute("UPDATE imgs_info SET auto_discarded=true WHERE file_name=%(img_name)s",
                           {'img_name': variables[0]})

        cursor.execute("SELECT discarded_by_user, auto_discarded FROM imgs_info WHERE file_name=%(img_name)s",
                       {'img_name': variables[0]})

    result = cursor.fetchall()

    conn.close()
    # Database connection closed

    return result

def get_img(dataset):
    ds = "ECP" if dataset == "eurocity" else dataset
    variables = [ds]
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

@app.route('/img_url/<dataset>', methods=['GET'])
def get_img_url(dataset):
    # Creating the low level functional client
    # Credentials can be specified but it is safer to keep them in environment variables. boto3 will look for
    # AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
    client = boto3.client('s3')

    try:
        img = get_img(dataset)
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
    variables = [file_name]
    json_file = str(open_DB_connection("get_json", variables, 'img_info')[0][0])

    #TEMPORARY TILL JSONS ARE IN STORAGE
    jsons_path = "annotations_json/"
    if dataset == "eurocity":
        jsons_path += "ECP/barcelona/" # Barcelona for test purposes
    elif dataset == "citypersons":
        jsons_path += "citypersons/strasbourg/"
    elif dataset == "nuscenes":
        jsons_path += "nuscenes/"

    for subdir, dirs, files in os.walk(jsons_path, onerror=walk_error_handler):
        if os.path.exists(subdir + '/' + json_file):
            with open(subdir + '/' + json_file) as f:
                json_data = json.load(f)
                break
    else:
        abort(404)

    return json_data

@app.route('/save_edited_json/<img_name>', methods=['POST'])
def save_edited_json(img_name):
    # POST request
    edited_json = request.get_json()
    variables = [img_name]
    json_file = str(open_DB_connection("get_json", variables, 'img_info')[0][0])
    json_file_path = "edited_jsons/" + json_file
    with open(json_file_path, 'w', encoding='utf-8') as f:
        json.dump(edited_json, f, ensure_ascii=False, indent=4)
    return 'OK', 200

@app.route('/user_credentials/<user_email>/<user_pwd>', methods=['GET'])
def login_user(user_email, user_pwd):
    variables = [user_email]
    db_result = open_DB_connection("login", variables, 'users')
    db_pwd = ""
    if db_result:
        db_pwd = db_result[0][1]
    encoded_pwd = user_pwd.encode()
    hashed_pwd = hashlib.sha256(encoded_pwd)

    if(hashed_pwd.hexdigest() == db_pwd):
        return 'OK', 200
    else:
        return 'KO', 403

@app.route('/discard-img/<discard_author>/<img_name>', methods=['GET'])
def discard_img(img_name, discard_author):
    variables = [img_name, discard_author]
    db_result = open_DB_connection("discard_img", variables, 'img_info')

    return 'OK', 200


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/<page>')
def render_page(page):
    return render_template(page)

def walk_error_handler(exception_instance):
    print("The specified path is incorrect or permission is needed")

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port='80')
