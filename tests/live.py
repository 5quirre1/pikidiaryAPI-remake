import requests
# so live feature ig yea idfk ok brb ima go live yea ok peak 111!1 back 

# bro wtf is ur wifi:sob:


username = input("what is pikidiary username: ")
if not username:
        print("put a pikidiary username smh")
        exit()
if username:
    print("yas slay giving info")
    
    try:
        response = requests.get(f"https://pikidiary-api.vercel.app?username={username}&show=isLive,liveInfo")
        json = response.json()
        isLive = json["isLive"]
        liveInfo = json["liveInfo"]
        print(isLive)
        if isLive:
            print(liveInfo)
    except requests.exceptions.RequestException as e:
        print(e)