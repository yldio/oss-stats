const orgMembers = [
    {
        "login": "sergioramos",
        "name": "Sérgio Ramos",
        "id": "MDQ6VXNlcjUwMTAxOA==",
        "url": "https://github.com/sergioramos",
        "periods": [
            {
                "joinDate": "Mar 2015"
            }
        ]
    },
    {
        "login": "fampinheiro",
        "name": "Filipe Pinheiro",
        "id": "MDQ6VXNlcjc2MzUyOA==",
        "url": "https://github.com/fampinheiro",
        "periods": [
            {
                "joinDate": "Sep 2015",
                "leaveDate": "Feb 2018"
            }
        ]
    },
    {
        "login": "fabiommmoreira",
        "name": "Fábio Moreira",
        "id": "MDQ6VXNlcjI1ODE4ODI2",
        "url": "https://github.com/fabiommmoreira",
        "periods": [
            {
                "joinDate": "Apr 2018"
            }
        ]
    },
    {
        "login": "FabioAntunes",
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
]

const membersData = {
  "sergioramos": {
    "name": "Sérgio Ramos",
    "id": "MDQ6VXNlcjUwMTAxOA==",
    "url": "https://github.com/sergioramos",
    "periods": [
      {
        "joinDate": "Mar 2015"
      }
    ]
  },
  "fampinheiro": {
    "name": "Filipe Pinheiro",
    "id": "MDQ6VXNlcjc2MzUyOA==",
    "url": "https://github.com/fampinheiro",
    "periods": [
      {
        "joinDate": "Sep 2015"
      }
    ]
  },
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

module.exports = { orgMembers, membersData }