import os
import sys
import json
import re

def compose(std_files_path, x_ann_files_path, composed_files_path):
    if not os.path.exists(composed_files_path):
        os.makedirs(composed_files_path)

    for file in os.listdir(x_ann_files_path):
        extracted_ann_file_path = x_ann_files_path + "/" + file
        with open(extracted_ann_file_path) as json_to_load:
            x_ann_json = json.load(json_to_load)
        file_parts = file.split("_")
        annotator_in_path = "_" + file_parts[len(file_parts) - 1]
        target_std_file = file.replace("extracted_", "").replace(annotator_in_path, ".json")

        std_ann_file_path = std_files_path + "/" + target_std_file
        with open(std_ann_file_path) as std_json_to_load:
            std_ann_json = json.load(std_json_to_load)

        std_ann_json["annotator"] = x_ann_json["annotator"]
        std_ann_json["error_in_labelling"] = x_ann_json["error_in_labelling"]

        for std_agent in std_ann_json["agents"]:
             for x_agent in x_ann_json["agents"]:
                 if std_agent["agent_img_id"] == x_agent["agent_id"]:
                     std_agent["attributes"] = x_agent["agent_annotated_attributes"]

        composed_annotations_file_path = composed_files_path + "/composed_" + str(file.replace("extracted_", ""))
        with open(composed_annotations_file_path, 'w', encoding='utf-8') as f:
            json.dump(std_ann_json, f, ensure_ascii=False, indent=4)



if __name__ == '__main__':
    standarized_jsons_path = str(sys.argv[1])
    extracted_annotation_files_path = str(sys.argv[2])
    full_annotation_files_path = str(sys.argv[3])
    compose(standarized_jsons_path, extracted_annotation_files_path, full_annotation_files_path)
