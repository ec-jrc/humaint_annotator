import os
import json
import shutil

#DEPRECATED METHOD
# def separate_imgs():
#     path = "../Datasets/nuscenes/ASIA/"
#     sample_json = json.load(open(os.path.join(path, "v1.0-mini/sample.json")))
#     sample_data_json = json.load(open(os.path.join(path, "v1.0-mini/sample_data.json")))
#     log_json = json.load(open(os.path.join(path, "v1.0-mini/log.json")))
#
#     for sample in sample_json:
#         log_token = sample['log_token']
#         sample_key_token = sample['key_camera_token']
#         for log in log_json:
#             if(log['token'] == log_token):
#                 city = log['location']
#                 break
#         for img in sample_data_json:
#             if(img['token'] == sample_key_token):
#                 img_name = img['filename'].split('/')[2]
#                 break
#
#         for file_name in os.listdir(path + '/samples'):
#             if file_name == img_name:
#                 if not os.path.exists(city):
#                     os.makedirs(city)
#                 shutil.copyfile(path + '/samples/' + file_name, city + '/' + file_name)
#                 break

def separate_imgs():
    jsons_path = "standarized_jsons/nuscenes/new/"
    imgs_path = "../Datasets/nuscenes/sweeps/"
    break_loop = False

    for city in os.listdir(jsons_path):
        for json_file in os.listdir(jsons_path + city):
            img_name = json_file.replace('json', 'jpg')
            for CAM in os.listdir(imgs_path):
                for img in os.listdir(imgs_path + CAM):
                    if img == img_name:
                        if not os.path.exists(imgs_path + 'new/' + city):
                            os.makedirs(imgs_path + 'new/' + city)
                        shutil.copyfile(imgs_path + CAM + '/' + img, imgs_path + 'new/' + city + '/' + img)
                        break_loop = True
                        break
                if break_loop:
                    break_loop = False
                    break


def separate_jsons():
    path = "standarized_jsons/nuscenes/new/"

    for sample in os.listdir(path):
        sample_json = json.load(open(os.path.join(path, sample)))
        city = sample_json['city_name']
        if not os.path.exists(city):
            os.makedirs(city)
        shutil.copyfile(path + sample, city + '/' + sample)


def main():
    separate_imgs()
    separate_jsons()

if __name__ == "__main__":
    main()