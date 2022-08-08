subset_to_evaluate = 'anno_val';
% load data
train_data = load(subset_to_evaluate + '.mat');

% Process image by image
aligned_data = {};
if strcmp(subset_to_evaluate,'anno_val')
    aligned_data = train_data.anno_val_aligned;
elseif strcmp(subset_to_evaluate,'anno_train')
    aligned_data = train_data.anno_train_aligned;
end
    
cell_of_annotations = cell(1, length(aligned_data));
for i = 1:length(aligned_data)
    im_name = aligned_data{i}.im_name;
    cityname = aligned_data{i}.cityname;
    
    %get number of agents
    number_agents = size(aligned_data{i}.bbs, 1);
    struct_of_agent = struct([]);
    struct_of_all_agents = struct([]);
    for j = 1:number_agents
        agent_no = "agent_" + j;
        struct_of_agent_data = struct('class_label', aligned_data{i}.bbs(j,1), 'x1', aligned_data{i}.bbs(j,2),...
                'y1', aligned_data{i}.bbs(j,3),'w', aligned_data{i}.bbs(j,4),'h', aligned_data{i}.bbs(j,5),...
                'instance_id', aligned_data{i}.bbs(j,5),'x1_vis', aligned_data{i}.bbs(j,6),'y1_vis', ...
                aligned_data{i}.bbs(j,7),'w_vis', aligned_data{i}.bbs(j,8),'h_vis', aligned_data{i}.bbs(j,9));

        struct_of_all_agents(1).(agent_no) = struct_of_agent_data;
    end
    
    struct_of_image_annotation = struct('im_name', im_name, 'cityname', cityname, 'bbs', {struct_of_all_agents});
    cell_of_annotations{1, i} = struct_of_image_annotation;
end

%%Write data to files
for k = 1:length(cell_of_annotations)
    [pathstr, name, ext] = fileparts(aligned_data{k}.im_name);
    file = fopen("annotations_json/" + subset_to_evaluate + "/" + name + "_annotation.json", 'w');
    encodedJSON = jsonencode(cell_of_annotations{k}); 
    fprintf(file, encodedJSON);
    fclose(file);
end