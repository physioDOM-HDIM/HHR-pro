PhysioDOM Request

|                                   | URL                  | Method
|-----------------------------------|----------------------|--------------
| login                             | /                    |  POST
|                                   | /api/login           |  POST
| logout                            | /logout              |

Get beneficiaries list            /api/beneficiaries

Part of beneficiary overview :

|                                   | URL
|-----------------------------------|--------------------------------------------------------------------------
| Get beneficiary summary           | /api/:beneficiaryID/summary
| Get beneficiary events log        | /api/:beneficiaryID/events
| Get beneficiary professionals     | /api/:beneficiaryID/professionals
| Get beneficiary personal contacts | /api/:beneficiaryID/contacts
| Get beneficiary services (1)      | /api/:beneficiaryID/services  
| Get beneficiary agenda            | /api/:beneficiaryID/agenda

(1) as services could be categorized, it may change 

Nota : IP means Inter professionnal

|                                   | URL
|-----------------------------------|--------------------------------------------------------------------------
| Get beneficiary Message To Home   | /api/:beneficiaryID/msg/home
| Get Beneficiary IP message        | /api/:beneficiaryID/msg/professional
| Get Beneficiary Agenda            | /api/:beneficiaryID/agenda
| Get Beneficiary Graph             | 

Directory section

|                                   | URL
|-----------------------------------|--------------------------------------------------------------------------
| Get Professionnal Directory       | /api/directory/professionals
| Get Extend Directory              | /api/directory/extends
| Get beneficiaries Directory       | /api/directory/beneficiaries

Administration

For Each user it will be great to have a session log : when they connect, when they leave, what beneficiary files thy access.

|                                   | URL
|-----------------------------------|--------------------------------------------------------------------------
| Get a user session log            | /api/directory/:userID/session
| Create a entry in directory       | /api/directory/professionals     POST
|                                   | /api/directory/extends           POST

