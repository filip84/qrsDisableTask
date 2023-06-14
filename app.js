const fs = require('fs');
const path = require('path')
const request = require('request')
var SimpleNodeLogger = require('simple-node-logger'),
	opts = {
		logFilePath: 'logs/qrs.log',
		timestampFormat: 'YYYY-MM-DD HH:mm:ss'
	},
	log = SimpleNodeLogger.createSimpleLogger(opts);

const {
	config
} = require('./config')
// Config settings
const whitelist = config().whitelist
const enable = config().enable
const host = config().host;
const certPath = config().certPath;
const user = config().user;
const allowedFailures = config().allowedFailures


// Check if file exists
const checkPath = (path) => {
	try {
		return fs.existsSync(path)
	} catch (e) {
		return false;
	}
}


const moveFile = (id) => {
    let oldFileName = `./tasks/${id}.json`
    let newFileName = `./archive/${id}.json`
    fs.rename(oldFileName, newFileName, (err) => {
        if(err) log.error(`moveFile ${oldFileName} to ${newFileName}:`, err.message)
        log.info(`moveFile ${oldFileName} to ${newFileName}:`, 'finished')
    })
}

// Disable a certain task
const disableTask = (obj) => {
	try {
       
		if (!obj) {
			log.error(`disableTask ${obj.name}:`, "No obj provided")
			return
		}

        /*
        //Test archive function
        moveFile(obj.id)
        return
        */

		// new task object to be put in qrs
		var updateObject = JSON.parse(JSON.stringify(obj))
		updateObject.enabled = false;

		// options    
		const options = {
			method: 'PUT',
			url: encodeURI(`${host}:4242/qrs/reloadtask/${obj.id}?Xrfkey=0123456789abcdef`),
			headers: {
				'x-Qlik-Xrfkey': '0123456789abcdef',
				'x-Qlik-User': user,
				'Content-Type': 'application/json'
			},
			json: updateObject,
			key: fs.readFileSync(path.join(certPath, 'client_key.pem')),
			cert: fs.readFileSync(path.join(certPath, 'client.pem')),
			ca: fs.readFileSync(path.join(certPath, 'root.pem'))
		}

		request(options, (err, message, data) => {
			if (err) {
				log.error(`disableTask ${obj.name}:`, err)
				return err
			}
			log.info(`disableTask ${obj.name}:`, message.statusCode)
            moveFile(obj.id)

			return obj
		})

	} catch (error) {
		log.error(`disableTask ${obj.name}:`, error)
		return error
	}
}

// Check all tasks and log failureCount
const checkTasks = () => {
    log.info("checkTask success:", "Init!")
    try {
        // options
        const options = {
            method: 'GET',
            url: encodeURI(`${host}:4242/qrs/reloadtask/full?Xrfkey=0123456789abcdef`),
            headers: {
                'x-Qlik-Xrfkey': '0123456789abcdef',
                'x-Qlik-User': user,
                'Content-Type': 'application/json'
            },
            key: fs.readFileSync(path.join(certPath, 'client_key.pem')),
            cert: fs.readFileSync(path.join(certPath, 'client.pem')),
            ca: fs.readFileSync(path.join(certPath, 'root.pem'))
        }

        request.get(options, (err, message, data) => {
            if (err) {
                log.error("checkTask failed.", err)
                return
            }
            log.info("checkTask success:", "triggered")

            const resp = JSON.parse(data)

            const slim = resp.map((item) => {
                return {
                    id: item.id,
                    name: item.name,
                    status: item.operational.lastExecutionResult.status,
                    modifiedDate: item.modifiedDate,
                    lastStartTime: item.operational.lastExecutionResult.startTime
                }
            })

            for (let i = 0; i < resp.length; i++) {
                // Check if task already is disabled
                if (!resp[i].enabled) continue
                // Check whitelist
                if(whitelist.indexOf(resp[i].id) > -1) continue
                let fileName = `./tasks/${resp[i].id}.json`;
                let check = checkPath(fileName)
                if (check) {
                    var fileData = JSON.parse(fs.readFileSync(fileName, "utf8"))
                    if (fileData.lastStartTime == resp[i].operational.lastExecutionResult.startTime) continue
                    fileData.failureCount++;
                    fileData.modfiedDate = resp[i].modfiedDate;
                    fileData.lastStartTime = resp[i].operational.lastExecutionResult.startTime;
                    // Compare failureCount with max allowedFailures
                    if (fileData.failureCount > allowedFailures) {
                        // Trigger disable task
                        disableTask(resp[i])
                    } else fs.writeFileSync(fileName, JSON.stringify(fileData))
                } else {
                    // Register task first time
                    slim[i].failureCount = 0;
                    fs.writeFile(fileName, JSON.stringify(slim[i]), {
                        flag: 'wx'
                    }, (err) => {
                        if (err) {
                            log.error("Error writing file: ", err)
                            return
                        }
                    })
                }
            }
            log.info("checkTask success:","finished")
        })

    } catch (error) {
        log.error("checkTask failed", error)
    }
}

//Init
if(enable) checkTasks()