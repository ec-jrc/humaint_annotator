import sys
import os
import json

persons_ids = [
    "pedestrian",
    "rider",
    "sitting person",
    "bicycle ",
    "wheelchair ",
    "cycle.with_rider",
    "human.pedestrian.adult",
    "human.pedestrian.child",
    "human.pedestrian.construction_worker",
    "human.pedestrian.personal_mobility",
    "human.pedestrian.police_officer",
    "human.pedestrian.stroller",
    "human.pedestrian.wheelchair",
    "cyclist",
    "person_sitting",
    "person"
]

vehicles_ids = [
"buggy ",
    "motorbike ",
    "scooter ",
    "tricycle ",
    "cycle.without_rider",
    "vehicle.moving",
    "vehicle.parked",
    "vehicle.stopped",
    "vehicle_light.emergency.flashing",
    "vehicle_light.emergency.not_flashing",
    "vehicle.bicycle",
    "vehicle.bus.bendy",
    "vehicle.bus.rigid",
    "vehicle.car",
    "vehicle.construction",
    "vehicle.emergency.ambulance",
    "vehicle.emergency.police",
    "vehicle.motorcycle",
    "vehicle.trailer",
    "vehicle.truck",
    "car",
    "van",
    "truck",
    "tram",
    "bus",
    "train",
    "motorcycle",
    "bike",
    "motor"
]

def calculate_area(x0, y0, x1, y1):
    x = x1 - x0
    y = y1 - y0

    return x*y

def count_agents(dir):
    cwd = os.getcwd()
    jsons_path = os.path.join(cwd, "standarized_jsons", dir)
    list_of_jsons = os.listdir(jsons_path)
    print("**********Processing {num_jsons} files for {set}**********".format(num_jsons=len(list_of_jsons), set=dir))

    num_agents_persons_sup_3000 = 0
    num_agents_persons_sup_6000 = 0
    num_agents_persons_sup_10000 = 0
    num_agents_vehicles_sup_2000 = 0
    num_agents_vehicles_sup_5000 = 0
    num_agents_vehicles_sup_8000 = 0

    for elem in list_of_jsons:
        with open(os.path.join(jsons_path, elem), 'r', encoding='utf-8') as json_file:
            json_data = json.load(json_file)

        im_name = json_data["im_name"]
        keyframe_name = json_data["key_frame_name"]
        if im_name == keyframe_name:
            agents = json_data["agents"]
            for agent in agents:
                x0 = agent["x0"]
                y0 = agent["y0"]
                x1 = agent["x1"]
                y1 = agent["y1"]
                agent_type = ""
                if agent["identity"] in persons_ids:
                    agent_type = "persons"
                elif agent["identity"] in vehicles_ids:
                    agent_type = "vehicles"
                else:
                    agent_type = "unknown"

                if agent_type != "unknown":
                    area = calculate_area(x0, y0, x1, y1)

                    if agent_type == "persons":
                        if area >= 3000:
                            num_agents_persons_sup_3000 += 1
                        if area >= 6000:
                            num_agents_persons_sup_6000 += 1
                        if area >= 10000:
                            num_agents_persons_sup_10000 += 1
                    else:
                        if area >= 2000:
                            num_agents_vehicles_sup_2000 += 1
                        if area >= 5000:
                            num_agents_vehicles_sup_5000 += 1
                        if area >= 8000:
                            num_agents_vehicles_sup_8000 += 1

    print("PERSONS STATS:")
    print("Number of agents with area >= 3000: {num_agents_persons_sup_3000}".format(num_agents_persons_sup_3000=num_agents_persons_sup_3000))
    print("Number of agents with area >= 6000: {num_agents_persons_sup_6000}".format(num_agents_persons_sup_6000=num_agents_persons_sup_6000))
    print("Number of agents with area >= 10000: {num_agents_persons_sup_10000}".format(num_agents_persons_sup_10000=num_agents_persons_sup_10000))
    print("-----------------")
    print("VEHICLES STATS:")
    print("Number of agents with area >= 2000: {num_agents_vehicles_sup_2000}".format(num_agents_vehicles_sup_2000=num_agents_vehicles_sup_2000))
    print("Number of agents with area >= 5000: {num_agents_vehicles_sup_5000}".format(num_agents_vehicles_sup_5000=num_agents_vehicles_sup_5000))
    print("Number of agents with area >= 8000: {num_agents_vehicles_sup_8000}".format(num_agents_vehicles_sup_8000=num_agents_vehicles_sup_8000))



if __name__ == "__main__":
    count_agents(str(sys.argv[1]))