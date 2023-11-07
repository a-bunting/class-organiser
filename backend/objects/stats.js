const fs = require('fs');

class Stats {

    MASTER_TIMER = null;
    MASTER_INTERVAL = 2;
    SAVE_TIME = 2; // days

    filename = 'stats.txt';
    stats = {
        users: [],
        processes: [],
        surveys: []
    }

    constructor() {}

    initiateStatistics() {
        this.loadStatsFromFile();
        this.MASTER_TIMER = setInterval(this.update.bind(this), this.MASTER_INTERVAL * 1000);
    }

    loadStatsFromFile() {
        fs.readFile('stats.txt', (e, r) => {
            if(!e) {
                this.stats = JSON.parse(r.toString());
            }
        })
    }

    saveStatsToFile() {
        fs.writeFile('stats.txt', JSON.stringify(this.stats), (e, r) => {
            if(e) {
                console.log(`Stats write error: ${e}`)
            }
        })
    }

    update() {
        this.saveStatsToFile();
        this.purge();
    }

    purge() {
        let checkValue = new Date().getTime() - this.SAVE_TIME*24*60*60*1000;

        // purge users
        let usersToDelete = [];
        
        for(let i = 0 ; i < this.stats.users.length ; i++) {
            if(this.stats.users[i].lastAction < checkValue) {
                // expired
                usersToDelete.push(i);
            }
        }
        
        this.stats.users = this.stats.users.filter((a, i) => !usersToDelete.includes(i));
        
        // purge processes
        let processesToDelete = [];

        for(let i = 0 ; i < this.stats.processes.length ; i++) {
            if(this.stats.processes[i].time < checkValue) {
                // expired
                processesToDelete.push(i);
            }
        }

        this.stats.processes = this.stats.processes.filter((a, i) => !processesToDelete.includes(i));
    }

    // methods
    userLoggedIn(userData) {
        let foundUser = this.stats.users.find(a => a.id === userData.id); //should be null

        // if for some reason the user is logged in then just update their status
        if(foundUser) {
            this.updateUserActivity(userData);
            return;
        }

        let user = {
            id: userData.id, 
            name: { forename: userData.name.forename, surname: userData.name.surname }, 
            login: new Date().getTime(),
            lastAction: new Date().getTime(),
            processes: 0
        }

        this.stats.users.push(user);
    }

    userLoggedOut(userId) {
        let foundUser = this.stats.users.findIndex(a => a.id === userId); //should be null

        if(foundUser !== -1) {
            this.stats.users.splice(foundUser, 1);
        }
    }

    updateUserActivity(userId) {
        let foundUser = this.stats.users.find(a => a.id === userId);
        if(foundUser) foundUser.lastAction = new Date().getTime();
        return foundUser;
    }
    
    userProcesses(userId, iterations, topStats) {
        let newProcess = {
            userId, iterations, topStats, 
            time: new Date().getTime()
        }
        
        this.stats.processes.push(newProcess);

        let foundUser = this.updateUserActivity(userId);
        if(foundUser) foundUser.processes++;
    }

    addSurveyData(code) {
        let survey = this.stats.surveys.find(a => a.code === code);

        if(survey) {
            // found, add user
            survey.count++;
            survey.time = new Date().getTime();
            return;
        }
        
        this.stats.surveys.push({ code, count: 1, time: new Date().getTime(), updates: 0 });
    }

    updateSurveyData(code) {
        let survey = this.stats.surveys.find(a => a.code === code);
        
        if(survey) {
            // found, add user
            survey.updates++;
            survey.time = new Date().getTime();
            return;
        }

        this.stats.surveys.push({ code, count: 0, time: new Date().getTime(), updates: 1 });
    }

}

module.exports = Stats;