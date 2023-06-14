## qrsDisableFailedTasks
Add this to your server to disable qlik sense tasks after n number of failures.

## Suggestion
Use widows scheduler to run this every 5min (the tracking is not live, it only tracks failures when it runs)

# Step 1
Fill in config
# Step 2
Create a windows scheduler task that runs the start.bat file every n minutes
# Step 3
Done


## endpoints
GET
https://help.qlik.com/en-US/sense-developer/May2023/APIs/RepositoryServiceAPI/index.html?page=1072

PUT
https://help.qlik.com/en-US/sense-developer/May2023/APIs/RepositoryServiceAPI/index.html?page=490
![image](https://github.com/filip84/qrsDisableTask/assets/48054901/28406f97-6686-4668-b404-09dff92c7272)
