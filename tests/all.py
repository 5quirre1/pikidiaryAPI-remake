import requests
import time

url = "https://pikidiary-api.vercel.app/?username=squirrel"

response = requests.get(url)
json_data = response.json()

wow = {
    "userUrl": json_data["userUrl"],
    "username": json_data["username"],
    "followers": json_data["followers"],
    "following": json_data["following"],
    "pfp": json_data["pfp"],
    "isVerified": json_data["isVerified"],
    "bio": json_data["bio"],
    "loginStreak": json_data["loginStreak"],
    "achievementsCount": json_data["achievementsCount"],
    "achievements": json_data["achievements"],
    "badges": json_data["badges"],
    "badgeCount": json_data["badgesCount"],
    "posts": json_data["posts"]
}

for key, value in wow.items():
    time.sleep(1)
    print(f"{key}: {value}")
