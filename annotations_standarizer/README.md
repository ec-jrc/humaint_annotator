# Tool description
The aim of this tool is to standarize the information available in dataset annotations files. The idea is to get a common file type and have the information in a more standard way so that it is easier to use it. The tool is programmed in Python and comes with several standarization procedures for different datasets. Please refer to [Available datasets](#available-datasets) to get a list of datasets that can be standarized right away with this tool.

# Available datasets
The following list shows the datasets that can already be standarized using this tool:
* **Citypersons**: Be aware that the original dataset comes in Matlab format and has to be converted to JSON first using the Converter tool. For more information on this dataset, refer to its [Find the dataset here](https://github.com/cvgroup-njust/CityPersons)
* **Eurocity persons** (ECP): [Find it here](https://eurocity-dataset.tudelft.nl/)
* **Nuscenes**: [Find it here](https://www.nuscenes.org/)
* **Tsinghua-Daimler**: [Find it here](http://www.lookingatpeople.com/download-tsinghua-daimler-cyclist/index.html)
* **KITTI**: [Find it here](http://www.cvlibs.net/datasets/kitti/)
* **BDD100K** (bair): [Find it here](https://doc.bdd100k.com/download.html)

# How to launch the tool
To launch the tool ensure that you have a virtual environment with Python 3 and type the following command on a terminal:  
  
`python standarizer.py <dataset> <dataset_path>`  
  
Where \<dataset\> is the name of the dataset to standarize (e.g. "ECP" for Eurocity persons) and  \<dataset_path\> is the dataset annotations path (e.g. ECP/ECP_day_labels_val/ECP/day/labels/val for Eurocity persons dataset)
