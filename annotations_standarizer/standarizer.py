import os
import sys
import json
import re
import uuid

class sub_entity:
    def __init__(self, identity, x0, y0, x1, y1, attributes):
        self.identity = identity
        self.x0 = x0
        self.y0 = y0
        self.x1 = x1
        self.y1 = y1
        self.attributes = attributes

class agent:
    def __init__(self, agent_img_id, uuid, identity, x0, y0, x1, y1, attributes, sub_entities):
        self.agent_img_id = agent_img_id
        self.uuid = uuid
        self.identity = identity
        self.x0 = x0
        self.y0 = y0
        self.x1 = x1
        self.y1 = y1
        self.attributes = attributes
        self.sub_entities = sub_entities


class Dataset_data:
    def __init__(self, im_name, city_name, im_width, im_height, sandbox_tags, agents):
        self.im_name = im_name
        self.city_name = city_name
        self.im_width = im_width
        self.im_height = im_height
        self.sandbox_tags = sandbox_tags
        self.agents = agents

def walk_error_handler(exception_instance):
    print("The specified path is incorrect or permission is needed")

def get_ECP_data(dataset_path):
    standarized_jsons_path = "standarized_jsons/eurocity/val_day/"
    if not os.path.exists(standarized_jsons_path):
        os.makedirs(standarized_jsons_path)

    for subdir, dirs, files in os.walk(dataset_path, onerror=walk_error_handler):
        for file in files:
            im_name = file.replace('.json', '.png')
            ext_to_remove = re.search(r'_.*', im_name)
            city_name = im_name.replace(ext_to_remove.group(), '')
            standarized_jsons_city_path = standarized_jsons_path + city_name
            if not os.path.exists(standarized_jsons_city_path):
                os.makedirs(standarized_jsons_city_path)
            im_width = 1920
            im_height = 1024
            with open(os.path.join(subdir, file)) as f:
                json_data = json.load(f)
                sandbox_tags = json_data['tags']
                loaded_agents = json_data['children']
                agent_num = 1
                standarized_agents_text = ""
                first_agent = True
                for agent in loaded_agents:
                    sub_entity_text = ""
                    first_sub_entity = True
                    for sub_entity in agent['children']:
                        if not first_sub_entity:
                            sub_entity_text += ','
                        else:
                            first_sub_entity = False
                        sub_entity_text += '{"identity": "' + sub_entity['identity'] + '"'
                        sub_entity_text += ', "x0": ' + str(sub_entity['x0'])
                        sub_entity_text += ', "y0": ' + str(sub_entity['y0'])
                        sub_entity_text += ', "x1": ' + str(sub_entity['x1'])
                        sub_entity_text += ', "y1": ' + str(sub_entity['y1'])
                        sub_entity_text += ', "attributes": '
                        sub_entity_text += '{"sandbox_tags": '
                        sub_entity_text += str(sub_entity['tags']).replace('\'', '"') + '}}'

                    if not first_agent:
                        standarized_agents_text += ','
                    else:
                        first_agent = False
                    standarized_agents_text += '{"agent_img_id": "agent_' + str(agent_num) + '"'
                    standarized_agents_text += ', "uuid": "' + str(uuid.uuid4()) + '"'
                    standarized_agents_text += ', "identity": "' + str(agent['identity']) + '"'
                    standarized_agents_text += ', "x0": ' + str(agent['x0'])
                    standarized_agents_text += ', "y0": ' + str(agent['y0'])
                    standarized_agents_text += ', "x1": ' + str(agent['x1'])
                    standarized_agents_text += ', "y1": ' + str(agent['y1'])
                    standarized_agents_text += ', "attributes": '
                    standarized_agents_text += '{"sandbox_tags": '
                    standarized_agents_text += str(agent['tags']).replace('\'', '"') + '}'
                    standarized_agents_text += ', "sub_entities": [' + sub_entity_text + ']}'

                    agent_num += 1

                agents = standarized_agents_text
                data = Dataset_data(im_name, city_name, im_width, im_height, sandbox_tags, agents)

            json_text = '{"im_name": "' + data.im_name + '"'
            json_text = json_text + ', "city_name": "' + data.city_name + '"'
            json_text = json_text + ', "im_width": ' + str(data.im_width)
            json_text = json_text + ', "im_height": ' + str(data.im_height)
            json_text = json_text + ', "sandbox_tags": ' + str(data.sandbox_tags).replace('\'', '"')
            json_text = json_text + ', "agents": [' + str(data.agents) + ']}'
            json_object = json.loads(json_text)

            with open(standarized_jsons_city_path + '/' + file, 'w', encoding='utf-8') as f:
                json.dump(json_object, f, ensure_ascii=False, indent=4)
                print("Saved " + standarized_jsons_city_path + '/' + file)

def get_citypersons_data(dataset_path):
    standarized_jsons_path = "standarized_jsons/citypersons/train/"
    if not os.path.exists(standarized_jsons_path):
        os.makedirs(standarized_jsons_path)

    class_labels = {
        0: "Ignore",
        1: "Pedestrian",
        2: "Rider",
        3: "Sitting person",
        4: "Person in unusual posture",
        5: "Group of people"
    }

    for subdir, dirs, files in os.walk(dataset_path, onerror=walk_error_handler):
        for file in files:
            with open(os.path.join(subdir, file), encoding='utf8') as f:
                json_data = json.load(f)
                im_name = json_data['im_name']
                city_name = json_data['cityname']
                standarized_jsons_city_path = standarized_jsons_path + city_name
                if not os.path.exists(standarized_jsons_city_path):
                    os.makedirs(standarized_jsons_city_path)
                im_width = 2048
                im_height = 1024
                sandbox_tags = "[]"
                loaded_agents = json_data['bbs']
                agent_num = 1
                standarized_agents_text = ""
                first_agent = True
                for agent in loaded_agents:
                    if not first_agent:
                        standarized_agents_text += ','
                    else:
                        first_agent = False
                    standarized_agents_text += '{"agent_img_id": "' + agent + '"'
                    standarized_agents_text += ', "uuid": "' + str(uuid.uuid4()) + '"'
                    standarized_agents_text += ', "identity": "' + class_labels[loaded_agents[agent]['class_label']] + '"'
                    standarized_agents_text += ', "x0": ' + str(loaded_agents[agent]['x1'])
                    standarized_agents_text += ', "y0": ' + str(loaded_agents[agent]['y1'])
                    standarized_agents_text += ', "x1": ' + str(loaded_agents[agent]['w'] + loaded_agents[agent]['x1'])
                    standarized_agents_text += ', "y1": ' + str(loaded_agents[agent]['h'] + loaded_agents[agent]['y1'])
                    standarized_agents_text += ', "attributes": '
                    standarized_agents_text += '{"sandbox_tags": []}'
                    standarized_agents_text += ', "sub_entities": []}'

                    agent_num += 1

                agents = standarized_agents_text
                data = Dataset_data(im_name, city_name, im_width, im_height, sandbox_tags, agents)

            json_text = '{"im_name": "' + data.im_name + '"'
            json_text = json_text + ', "city_name": "' + data.city_name + '"'
            json_text = json_text + ', "im_width": ' + str(data.im_width)
            json_text = json_text + ', "im_height": ' + str(data.im_height)
            json_text = json_text + ', "sandbox_tags": ' + str(data.sandbox_tags).replace('\'', '"')
            json_text = json_text + ', "agents": [' + str(data.agents) + ']}'
            json_object = json.loads(json_text)

            with open(standarized_jsons_city_path + '/' + file, 'w', encoding='utf-8') as f:
                json.dump(json_object, f, ensure_ascii=False, indent=4)
                print("Saved " + standarized_jsons_city_path + '/' + file)

def get_nuscenes_data(jsons_path):
    standarized_jsons_path = "standarized_jsons/nuscenes/new_standarized"
    #ds = jsons_path.split('/')
    #zone = ds[len(ds) - 2].split(' ')[2]
    #standarized_jsons_zone_path = standarized_jsons_path + zone
    files_with_error = []

    if not os.path.exists(standarized_jsons_path):
        os.makedirs(standarized_jsons_path)

    log_json = json.load(open(os.path.join(jsons_path, "new_log.json")))
    sample_data_json = json.load(open(os.path.join(jsons_path, "new_sample_data.json")))
    sample_json = json.load(open(os.path.join(jsons_path, "new_sample.json")))
    object_ann_json = json.load(open(os.path.join(jsons_path, "new_object_ann.json")))
    category_json = json.load(open(os.path.join(jsons_path, "category.json")))
    attributes_json = json.load(open(os.path.join(jsons_path, "attribute.json")))

    for keyframe in sample_json:
        keyframe_id = keyframe['key_camera_token']
        key_sample_token = keyframe['token']
        log_id = keyframe['log_token']
        im_names = []
        city_name = ''
        sandbox_tags = '[{"key_sample_token": "' + key_sample_token + '"}]'
        im_widths = []
        im_heights = []

        for log in log_json:
            if(log['token'] == log_id):
                city_name = log['location']
                break

        for sample in sample_data_json:
            if(sample['token'] == keyframe_id or sample['sample_token'] == key_sample_token):
                im_name_parts = sample['filename'].split('/')
                im_names.append(im_name_parts[len(im_name_parts) - 1])
                im_widths.append(sample['width'])
                im_heights.append(sample['height'])

        agent_img_id = ''
        agent_sandbox_tags = ''
        unique_id = ''
        identity = ''
        x0 = 0
        y0 = 0
        x1 = 0
        y1 = 0
        attributes = ''
        agent_num = 1
        standarized_agents_text = ''
        first_agent = True
        for object in object_ann_json:
            if(object['sample_data_token'] == keyframe_id):
                agent_img_id = 'agent_' + str(agent_num)
                agent_num += 1
                agent_sandbox_tags = '[{"original_agent_token": "' + object['token'] + '"}]'
                unique_id = str(uuid.uuid4())
                for category in category_json:
                    if(category['token'] == object['category_token']):
                        identity = category['name']
                        break
                x0 = object['bbox'][0]
                y0 = object['bbox'][1]
                x1 = object['bbox'][2]
                y1 = object['bbox'][3]
                attributes = '{'
                first_attr = True
                for attribute in object['attribute_tokens']:
                    for attr in attributes_json:
                        if(attr['token'] == attribute):
                            if not first_attr:
                                attributes += ','
                            else:
                                first_attr = False
                            attributes += '"sandbox_tags": ["' + attr['name'] + '"]}'
                            break
                if(first_attr == True):
                    attributes += '"sandbox_tags": []}'

                if not first_agent:
                    standarized_agents_text += ','
                else:
                    first_agent = False
                standarized_agents_text += '{"agent_img_id": "' + agent_img_id + '"'
                standarized_agents_text += ', "uuid": "' + unique_id + '"'
                standarized_agents_text += ', "identity": "' + identity + '"'
                standarized_agents_text += ', "x0": ' + str(x0)
                standarized_agents_text += ', "y0": ' + str(y0)
                standarized_agents_text += ', "x1": ' + str(x1)
                standarized_agents_text += ', "y1": ' + str(y1)
                standarized_agents_text += ', "attributes": ' + attributes
                standarized_agents_text += ', "sandbox_tags": ' + agent_sandbox_tags
                standarized_agents_text += ', "sub_entities": []}'

        agents = standarized_agents_text

        i = 0
        while(i < len(im_names)):
            data = Dataset_data(im_names[i], city_name, im_widths[i], im_heights[i], sandbox_tags, agents)

            json_text = '{"im_name": "' + data.im_name + '"'
            json_text = json_text + ', "key_frame_name": "' + im_names[0] + '"'
            json_text = json_text + ', "city_name": "' + data.city_name + '"'
            json_text = json_text + ', "im_width": ' + str(data.im_width)
            json_text = json_text + ', "im_height": ' + str(data.im_height)
            json_text = json_text + ', "sandbox_tags": ' + str(data.sandbox_tags).replace('\'', '"')
            json_text = json_text + ', "agents": [' + str(data.agents) + ']}'

            json_object = json.loads(json_text)

            im_name_splitted = data.im_name.split("/")
            new_file = im_name_splitted[len(im_name_splitted) - 1].replace(".jpg", ".json")

            with open(standarized_jsons_path + '/' + new_file, 'w', encoding='utf-8') as f:
                json.dump(json_object, f, ensure_ascii=False, indent=4)
                print("Saved " + standarized_jsons_path + '/' + new_file)

            i += 1

def get_tsinghua_daimler_data(dataset_path):
    standarized_jsons_path = "standarized_jsons/tsinghua-daimler/valid"

    if not os.path.exists(standarized_jsons_path):
        os.makedirs(standarized_jsons_path)

    for subdir, dirs, files in os.walk(dataset_path, onerror=walk_error_handler):
        list_of_trackers = {}
        for file in files:
            with open(os.path.join(subdir, file)) as f:
                json_data = json.load(f)
                im_name = json_data['imagename']
                city_name = 'N/A'
                if not os.path.exists(standarized_jsons_path):
                    os.makedirs(standarized_jsons_path)
                im_width = 2048
                im_height = 1024
                sandbox_tags = "[]"
                loaded_agents = json_data['children']
                agent_num = 1
                standarized_agents_text = ""
                first_agent = True
                for agent in loaded_agents:
                    if not first_agent:
                        standarized_agents_text += ','
                    else:
                        first_agent = False

                    if str(agent['trackid']) not in list_of_trackers:
                        list_of_trackers[str(agent['trackid'])] = str(uuid.uuid4())

                    standarized_agents_text += '{"agent_img_id": "agent_' + str(agent_num) + '"'
                    standarized_agents_text += ', "uuid": "' + list_of_trackers[str(agent['trackid'])] + '"'
                    standarized_agents_text += ', "identity": "' + agent['identity'] + '"'
                    standarized_agents_text += ', "x0": ' + str(agent['mincol'])
                    standarized_agents_text += ', "y0": ' + str(agent['minrow'])
                    standarized_agents_text += ', "x1": ' + str(agent['maxcol'])
                    standarized_agents_text += ', "y1": ' + str(agent['maxrow'])
                    standarized_agents_text += ', "attributes": '
                    standarized_agents_text += '{"sandbox_tags": [{"original_agent_trackid": "' + str(agent['trackid']) + '"}]}'
                    standarized_agents_text += ', "sub_entities": []}'

                    agent_num += 1

                agents = standarized_agents_text
                data = Dataset_data(im_name, city_name, im_width, im_height, sandbox_tags, agents)

            json_text = '{"im_name": "' + data.im_name + '"'
            json_text = json_text + ', "city_name": "' + data.city_name + '"'
            json_text = json_text + ', "im_width": ' + str(data.im_width)
            json_text = json_text + ', "im_height": ' + str(data.im_height)
            json_text = json_text + ', "sandbox_tags": ' + str(data.sandbox_tags).replace('\'', '"')
            json_text = json_text + ', "agents": [' + str(data.agents) + ']}'
            json_object = json.loads(json_text)

            with open(standarized_jsons_path + '/' + file, 'w', encoding='utf-8') as f:
                json.dump(json_object, f, ensure_ascii=False, indent=4)
                print("Saved " + standarized_jsons_path + '/' + file)

def get_kitti_data(dataset_path):
    standarized_jsons_path = "standarized_jsons/kitti"

    if not os.path.exists(standarized_jsons_path):
        os.makedirs(standarized_jsons_path)

    for subdir, dirs, files in os.walk(dataset_path, onerror=walk_error_handler):
        list_of_trackers = {}
        for file in files:
            im_name = file.replace('.txt', '.png')
            city_name = 'N/A'
            im_width = 1224
            im_height = 370
            sandbox_tags = "[]"

            with open(os.path.join(subdir, file)) as f:
                lines = f.readlines()
                agent_num = 1
                standarized_agents_text = ""
                first_agent = True
                for agent in lines:
                    if not first_agent:
                        standarized_agents_text += ','
                    else:
                        first_agent = False

                    elems = agent.split(" ")
                    identity = elems[0]
                    x0 = elems[4]
                    y0 = elems[5]
                    x1 = elems[6]
                    y1 = elems[7]
                    agent_height = elems[8]
                    agent_width = elems[9]

                    standarized_agents_text += '{"agent_img_id": "agent_' + str(agent_num) + '"'
                    standarized_agents_text += ', "uuid": "' + str(uuid.uuid4()) + '"'
                    standarized_agents_text += ', "identity": "' + identity + '"'
                    standarized_agents_text += ', "x0": ' + x0
                    standarized_agents_text += ', "y0": ' + y0
                    standarized_agents_text += ', "x1": ' + x1
                    standarized_agents_text += ', "y1": ' + y1
                    standarized_agents_text += ', "attributes": '
                    standarized_agents_text += '{"sandbox_tags": [{"original_agent_height": "' + agent_height + '"'
                    standarized_agents_text += ', "original_agent_width": "' + agent_width + '"}]}'
                    standarized_agents_text += ', "sub_entities": []}'

                    agent_num += 1

                agents = standarized_agents_text
                data = Dataset_data(im_name, city_name, im_width, im_height, sandbox_tags, agents)

            json_text = '{"im_name": "' + data.im_name + '"'
            json_text = json_text + ', "city_name": "' + data.city_name + '"'
            json_text = json_text + ', "im_width": ' + str(data.im_width)
            json_text = json_text + ', "im_height": ' + str(data.im_height)
            json_text = json_text + ', "sandbox_tags": ' + str(data.sandbox_tags).replace('\'', '"')
            json_text = json_text + ', "agents": [' + str(data.agents) + ']}'
            json_object = json.loads(json_text)

            with open(standarized_jsons_path + '/' + file.replace(".txt", ".json"), 'w', encoding='utf-8') as f:
                json.dump(json_object, f, ensure_ascii=False, indent=4)
                print("Saved " + standarized_jsons_path + '/' + file.replace(".txt", ".json"))

def get_bair_data(dataset_path):
    standarized_jsons_path = "standarized_jsons/bdd100k/train"

    if not os.path.exists(standarized_jsons_path):
        os.makedirs(standarized_jsons_path)

    for subdir, dirs, files in os.walk(dataset_path, onerror=walk_error_handler):
        list_of_trackers = {}
        for file in files:
            if(file == "bdd100k_labels_images_train.json"):
                with open(os.path.join(subdir, file)) as f:
                    json_data = json.load(f)
                    for img_elem in json_data:
                        im_name = img_elem['name']
                        city_name = 'N/A'
                        im_width = 1280
                        im_height = 720
                        sandbox_tags = '[{'
                        for tag in img_elem['attributes']:
                            if (sandbox_tags != '[{'):
                                sandbox_tags += ', '
                            sandbox_tags += '"' + tag + '": "' + str(img_elem['attributes'][tag]).lower() + '"'
                        sandbox_tags += '}]'

                        agent_num = 1
                        standarized_agents_text = ""
                        first_agent = True
                        for agent in img_elem['labels']:
                            if "box2d" in agent:
                                if not first_agent:
                                    standarized_agents_text += ','
                                else:
                                    first_agent = False

                                identity = agent['category']
                                x0 = agent['box2d']['x1']
                                y0 = agent['box2d']['y1']
                                x1 = agent['box2d']['x2']
                                y1 = agent['box2d']['y2']
                                orig_attr = '{'
                                for attr in agent['attributes']:
                                    if(orig_attr != '{'):
                                        orig_attr += ', '
                                    orig_attr += '"' + attr + '": "' + str(agent['attributes'][attr]).lower() + '"'
                                orig_attr += '}'

                                standarized_agents_text += '{"agent_img_id": "agent_' + str(agent_num) + '"'
                                standarized_agents_text += ', "uuid": "' + str(uuid.uuid4()) + '"'
                                standarized_agents_text += ', "identity": "' + identity + '"'
                                standarized_agents_text += ', "x0": ' + str(x0)
                                standarized_agents_text += ', "y0": ' + str(y0)
                                standarized_agents_text += ', "x1": ' + str(x1)
                                standarized_agents_text += ', "y1": ' + str(y1)
                                standarized_agents_text += ', "attributes": '
                                standarized_agents_text += '{"sandbox_tags": [' + str(orig_attr) + ']}'
                                standarized_agents_text += ', "sub_entities": []}'

                                agent_num += 1

                        agents = standarized_agents_text
                        data = Dataset_data(im_name, city_name, im_width, im_height, sandbox_tags, agents)

                        json_text = '{"im_name": "' + data.im_name + '"'
                        json_text = json_text + ', "city_name": "' + data.city_name + '"'
                        json_text = json_text + ', "im_width": ' + str(data.im_width)
                        json_text = json_text + ', "im_height": ' + str(data.im_height)
                        json_text = json_text + ', "sandbox_tags": ' + str(data.sandbox_tags).replace('\'', '"')
                        json_text = json_text + ', "agents": [' + str(data.agents) + ']}'
                        json_object = json.loads(json_text)

                        with open(standarized_jsons_path + '/' + im_name.replace(".jpg", ".json"), 'w', encoding='utf-8') as f:
                            json.dump(json_object, f, ensure_ascii=False, indent=4)
                            print("Saved " + standarized_jsons_path + '/' + im_name.replace(".jpg", ".json"))

def standarize(dataset, dataset_path):
    if(dataset == "citypersons"):
        get_citypersons_data(dataset_path)
    elif(dataset == "ECP"):
        get_ECP_data(dataset_path)
    elif(dataset == "nuscenes"):
        get_nuscenes_data(dataset_path)
    elif(dataset == "tsinghua-daimler"):
        get_tsinghua_daimler_data(dataset_path)
    elif(dataset == "kitti"):
        get_kitti_data(dataset_path)
    elif(dataset == "bair"):
        get_bair_data(dataset_path)
    else:
        print("The specified dataset does not exist")

if __name__ == "__main__":
    dataset = str(sys.argv[1])
    dataset_path = str(sys.argv[2])
    standarize(dataset, dataset_path)
