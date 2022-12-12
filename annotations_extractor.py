import os
import sys
import json

def extract_annotations(in_path, out_path):
    if not os.path.exists(out_path):
        os.makedirs(out_path)
    for in_file in os.listdir(in_path):
        out_agents = []
        in_file_path = in_path + "/" + in_file
        with open(in_file_path) as json_to_load:
            in_json = json.load(json_to_load)
        for in_agent in in_json["agents"]:
            out_agent_id = in_agent["agent_img_id"]
            out_agent_attributes = in_agent["attributes"]
            out_agent = {
                "agent_id": out_agent_id,
                "agent_annotated_attributes": out_agent_attributes
            }
            out_agents.append(out_agent)
        out_file_json = {
            "agents": out_agents,
            "annotator": in_json["annotator"],
            "error_in_labelling": in_json["error_in_labelling"]
        }

        extracted_annotations_file_path = out_path + "/extracted_" + str(in_file)
        with open(extracted_annotations_file_path, 'w', encoding='utf-8') as f:
            json.dump(out_file_json, f, ensure_ascii=False, indent=4)


if __name__ == '__main__':
    full_annotation_files_path = str(sys.argv[1])
    extracted_annotation_files_path = str(sys.argv[2])
    extract_annotations(full_annotation_files_path, extracted_annotation_files_path)