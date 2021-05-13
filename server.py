import os
import json
import logging
import random
import boto3
from botocore.exceptions import ClientError
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from flask import Flask, render_template, jsonify, abort

app = Flask(__name__)

def open_DB_connection(query):
    conn_string = "host='localhost' dbname='img_info' user='postgres'"
    conn = psycopg2.connect(conn_string)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)

    #Database connection established
    cursor = conn.cursor()
    cursor.execute(query)

    result = cursor.fetchall()#All images which have not been annotated

    conn.close()
    # Database connection closed

    return result

def get_img():
    query = "SELECT img_id, dataset, city, file_name FROM imgs_info WHERE dataset='ECP' AND annotated IS NOT TRUE"
    images = open_DB_connection(query)
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

@app.route('/img_url', methods=['GET'])
def get_img_url():
    # Creating the low level functional client
    # Credentials can be specified but it is safer to keep them in environment variables. boto3 will look for
    # AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
    client = boto3.client('s3')

    try:
        img = get_img()
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
    query = "SELECT associated_json FROM imgs_info WHERE file_name='" + file_name + "';"
    json_file = str(open_DB_connection(query)[0][0])

    #TEMPORARY TILL JSONS ARE IN STORAGE
    jsons_path = "annotations_json/"
    if dataset == "eurocity":
        jsons_path += "ECP/ECP_day_labels_val/ECP/day/labels/val/barcelona/" # Barcelona for test purposes
    elif dataset == "citypersons":
        jsons_path += "citypersons/anno_val/"

    if os.path.exists(jsons_path + json_file):
        with open(jsons_path + json_file) as f:
            json_data = json.load(f)
    else:
        abort(404)

    return json_data

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/<page>')
def render_page(page):
    return render_template(page)

if __name__ == '__main__':
    app.run(debug=True, host='localhost', port='8080')