const getUserData = require('../utils/getUserData');

/**
 * Takes and org member log string with data regarding the join/leave date and github usernames as:
 * Fábio Moreira,Joined YLD,Apr 2018,fabiommmoreira
 * Fábio Antunes (2),Joined YLD,Feb 2017,FabioAntunes
 * Fábio Antunes (2),Left YLD,May 2018,FabioAntunes
 * Fábio Antunes (1),Joined YLD,Mar 2019,FabioAntunes
 * 
 * 
 * from which it takes usernames and the working periods each member contributed to the org
 * and return a formatted JSON with additional data obtained from github:
 * {
    "fabiommmoreira": {
      "name": "Fábio Moreira",
      "id": "MDQ6VXNlcjI1ODE4ODI2",
      "url": "https://github.com/fabiommmoreira",
      "periods": [
        {
          "joinDate": "Apr 2018"
        }
      ]
    },
    "FabioAntunes": {
      "name": "Fábio Antunes (2)",
      "id": "MDQ6VXNlcjI1NDQ2NzM=",
      "url": "https://github.com/FabioAntunes",
      "periods": [
        {
          "joinDate": "Mar 2019"
        },
        {
          "joinDate": "Feb 2017",
          "leaveDate": "May 2018"
        }
      ]
    }
  }
 */
const generateMembersDataFromLog = async (membersLog) => {
  const memberDataArr = membersLog.split('\n');
  let memberData = {};

  for (const entry of memberDataArr) {
    const [name, type, date, username] = entry.split(',');

    if(username) {
      if(!memberData[username]) {
        const { user: { id, url } } = await getUserData(username);
        memberData[username] = { name, id, url, periods: [] };
      }

      const regex = /[^\(]+(?=\))/g;
      const recordCount = regex.exec(name);
      const periodNumber = recordCount ? recordCount[0] - 1 : 0;

      if(!memberData[username].periods[periodNumber]) {
        memberData[username].periods[periodNumber] = {};
      }

      if(type.includes("Joined")) {
        memberData[username].periods[periodNumber].joinDate = date;
      } else {
        memberData[username].periods[periodNumber].leaveDate = date;
      }
    }
  }

  return memberData;
}

async function getOrgMembers(membersLog) {
  const membersData = await generateMembersDataFromLog(membersLog);
  const usernames = Object.keys(membersData);
  const userData = usernames.map(username => ({ login: username, ...membersData[username] }));

  return userData;
}


module.exports = { generateMembersDataFromLog, getOrgMembers };

