import requests

while True:
    username = input("what is pikidiary username: ")
    if not username:
        print("put a pikidiary username smh")
        continue
    break

try:
    response = requests.get(f"https://pikidiary-api.vercel.app?username={username}&show=isLive,liveInfo")
    response.raise_for_status() 

    data = response.json()

    isLive = data.get("isLive")
    liveInfo = data.get("liveInfo")
    
    if isLive is None or liveInfo is None:
        print("\033[91merror:\033[0m smth is wrong with the api, try again later cause it will prob get fixed")
        print(f"full response: {data}")
    elif not isLive:
        print(f"{username} is not streaming right now..")
    elif isLive: 
        if liveInfo:
            print(f"{username} is currently live!!")
            print(f"live Info: {liveInfo}")
        else:
            print(f"{username} is live but api geeked out or smth")

except requests.exceptions.HTTPError as e:
    if response.status_code == 404:
        print(f"user '{username}' does not exist on pikidiary :c")
    else:
        print(f"a http error happened: {e}")
        print(f"status code: {response.status_code}")
        print(f"response text: {response.text}")
except requests.exceptions.ConnectionError:
    print("a connection erorr happened, check your wifi")
except requests.exceptions.Timeout:
    print("slow api")
except requests.exceptions.RequestException as e:
    print(f"random thing happened: {e}")
except ValueError as e:
    print(f"error parsing json: {e}")
