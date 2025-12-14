# Bulk-sms
{
  "name": "Kylian",
  "email": "kylian@example.com",
    "password": "kylian456"
}
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc2NTcwNzE2MywianRpIjoiZWZjMTNkZjgtMGI2Ny00N2I5LTgyYjUtNDQ1Y2RmNzg4NDc2IiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjEiLCJuYmYiOjE3NjU3MDcxNjMsImNzcmYiOiJiNDEyYWM0OC04YmI5LTQ0NjAtOWVjOS03NTc2ZDY1NDIyZTkiLCJleHAiOjE3NjU3MzU5NjMsInJvbGUiOiJ1c2VyIn0.RxB1aNZe0yN0Vws3QSLyUfMuXWcvXBX_mWPjwdKTtjs",
    "user": {
        "id": 1,
        "name": "Kylian",
        "email": "kylian@example.com",
        "role": "user"
    }
}
contact
{
  "name": "Client One",
  "phone": "+254700111222",
  "email": "client1@example.com"
}
{
    "id": 1,
    "name": "Client One",
    "phone": "+254700111222",
    "email": "client1@example.com",
    "is_opted_out": false
}
group
{
  "name": "VIP Clients",
  "description": "High value customers"
  "description": "High value customers"
}
POSThtp://localhost:5000/groups/1/contacts
{
    "id": 1,
    "name": "VIP Clients",
    "contacts_count": 1
}
{
  "id": 1,
  "name": "VIP Clients",
  "description": "High value customers",
  "contacts": [
    {
      "id": 1,
      "name": "Client One",
      "phone": "+254700111222",
      "email": "client1@example.com",
      "is_opted_out": false
    }
  ]
}
