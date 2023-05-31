const config = () => {
    return {
        // Enable the app
        enable: true,
        // Enter the qlik host server
        host: '',
        // Enter the qlik user that runs the QRS api, default: "UserDirectory= Internal; UserId= sa_repository"
        user: "UserDirectory= Internal; UserId= sa_repository",
        // Enter the qlik cert path, if you target an external server you need to export certificates
        certPath: 'c:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates',
        // Enter the number of allowed failures per task before disable
        allowedFailures: 5,
        // Whitelist certain task id's that should not be affected
        whitelist: [
            ''
        ]
    }
}

module.exports = {
    config
}