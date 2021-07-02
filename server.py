import os
import json
import logging
import random
import boto3
import hashlib
from botocore.exceptions import ClientError
import psycopg2
from psycopg2 import sql
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from flask import Flask, render_template, jsonify, abort, request

app = Flask(__name__)

def open_DB_connection(rqst, variable, db_name):
    conn_string = "host='localhost' dbname='" + db_name + "' user='postgres' password='123456'"
    conn = psycopg2.connect(conn_string)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)

    #Database connection established
    cursor = conn.cursor()
    if rqst == "login":
        cursor.execute("SELECT username, pwd FROM user_info WHERE user_email=%(user_email)s", {'user_email': variable})
    elif rqst == "get_img":
        cursor.execute("SELECT img_id, dataset, city, file_name FROM imgs_info WHERE dataset=%(dataset)s AND annotated IS NOT TRUE",
                       {'dataset': variable})
    elif rqst == "get_json":
        cursor.execute("SELECT associated_json FROM imgs_info WHERE file_name=%(json_file)s", {'json_file': variable})

    result = cursor.fetchall()#All images which have not been annotated

    conn.close()
    # Database connection closed

    return result

def get_img(dataset):
    ds = "ECP" if dataset == "eurocity" else dataset
    images = open_DB_connection("get_img", ds, 'img_info')
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
    json_file = str(open_DB_connection("get_json", file_name, 'img_info')[0][0])

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
    json_file = str(open_DB_connection("get_json", img_name, 'img_info')[0][0])
    json_file_path = "edited_jsons/" + json_file
    with open(json_file_path, 'w', encoding='utf-8') as f:
        json.dump(edited_json, f, ensure_ascii=False, indent=4)
    return 'OK', 200

@app.route('/user_credentials/<user_email>/<user_pwd>', methods=['GET'])
def login_user(user_email, user_pwd):
    db_result = open_DB_connection("login", user_email, 'users')
    db_pwd = ""
    if db_result:
        db_pwd = db_result[0][1]
    encoded_pwd = user_pwd.encode()
    hashed_pwd = hashlib.sha256(encoded_pwd)

    if(hashed_pwd.hexdigest() == db_pwd):
        return 'OK', 200
    else:
        return 'KO', 403


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/<page>')
def render_page(page):
    return render_template(page)

def walk_error_handler(exception_instance):
    print("The specified path is incorrect or permission is needed")

if __name__ == '__main__':
    app.run(debug=True, host='localhost', port='8080')
