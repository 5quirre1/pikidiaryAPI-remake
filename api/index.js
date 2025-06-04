/*
 *  ================================================
 *  -------------PIKIDIARY API REMAKE---------------
 *          CODE BY SQUIRREL GREG ACORNS!!
 *  =================================================
 *        Give credit if you steal my code sob
 *  =================================================
 *  PIKIDIARY IS OWNED BY JAX. I DO NOT OWN PIKIDIARY
 *  THIS IS LITTERALLY JUST FOR FAN PURPOSES LMFAO
 *  =================================================
 *  /////////////////////////////////////////////////////////////////////////////
 *  MIT License
 *  
 *  Copyright (c) 2025 Squirrel
 *  
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *  
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *  
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 *  /////////////////////////////////////////////////////////////////////////////
 */

module.exports = (req, res) => {
    const { query } = req;
    const username = query.username;
    const showFields = query.show ? query.show.split(',').map(field => field.trim()) : [];

    res.setHeader('Access-Control-Allow-Origin', '*');

    const baseUrl = 'https://pikidiary.lol';


    let responseObject = {};

    if (showFields.length > 0) {
        showFields.forEach(field => {
            switch (field) {
                case 'username':
                    responseObject.username = null;
                    break;
                case 'followers':
                    responseObject.followers = null;
                    break;
                case 'following':
                    responseObject.following = null;
                    break;
                case 'pfp':
                    responseObject.pfp = "https://images2.minutemediacdn.com/image/upload/c_fill,w_1200,ar_1:1,f_auto,q_auto,g_auto/shape/cover/sport/clown-4-104309a9de96b5c3b380947359b31f69.jpg";
                    break;
                case 'banner':
                    responseObject.banner = null;
                    break;
                case 'background':
                    responseObject.background = null;
                    break;
                case 'isVerified':
                    responseObject.isVerified = null;
                    break;
                case 'bio':
                    responseObject.bio = null;
                    break;
                case 'loginStreak':
                    responseObject.loginStreak = null;
                    break;
                case 'achievementsCount':
                    responseObject.achievementsCount = null;
                    break;
                case 'achievements':
                    responseObject.achievements = null;
                    break;
                case 'badgeCount':
                    responseObject.badgeCount = null;
                    break;
                case 'badges':
                    responseObject.badges = null;
                    break;
                case 'posts':
                    responseObject.posts = [
                        {
                            "id": 69,
                            "url": null,
                            "author": "5quirre1",
                            "content": "pikiapi is down rn",
                            "createdAt": "idfk",
                            "timestamp": new Date().toISOString(),
                            "media": [],
                            "likes": 0,
                            "comments": 0,
                            "isPinned": false,
                            "isLocked": false,
                            "isReply": false
                        }
                    ];
                    break;
                case 'isAdmin':
                    responseObject.isAdmin = null;
                    break;
                case 'isDonator':
                    responseObject.isDonator = null;
                    break;
                case 'isInactive':
                    responseObject.isInactive = null;
                    break;
                case 'userId':
                    responseObject.userId = null;
                    break;
                case 'isLive':
                    responseObject.isLive = null;
                    break;
                case 'liveInfo':
                    responseObject.liveInfo = null;
                    break;
                default:
                    break;
            }
        });
    } else {
        responseObject = {
            userId: null,
            userUrl: "https://wow.com",
            username: null,
            followers: null,
            following: null,
            pfp: "https://images2.minutemediacdn.com/image/upload/c_fill,w_1200,ar_1:1,f_auto,q_auto,g_auto/shape/cover/sport/clown-4-104309a9de96b5c3b380947359b31f69.jpg",
            banner: "https://images2.minutemediacdn.com/image/upload/c_fill,w_1200,ar_1:1,f_auto,q_auto,g_auto/shape/cover/sport/clown-4-104309a9de96b5c3b380947359b31f69.jpg",
            background: "https://images2.minutemediacdn.com/image/upload/c_fill,w_1200,ar_1:1,f_auto,q_auto,g_auto/shape/cover/sport/clown-4-104309a9de96b5c3b380947359b31f69.jpg",
            isVerified: null,
            isInactive: null,
            isAdmin: null,
            isDonator: null,
            isLive: null,
            bio: null,
            loginStreak: null,
            achievementsCount: null,
            achievements: null,
            badgeCount: null,
            badges: null,
            posts: [
                {
                    "id": 69,
                    "url": null,
                    "author": "5quirre1",
                    "content": "pikiapi is down rn",
                    "createdAt": "idfk",
                    "timestamp": new Date().toISOString(),
                    "media": [],
                    "likes": 0,
                    "comments": 0,
                    "isPinned": false,
                    "isLocked": false,
                    "isReply": false
                }
            ]
        };
    }

    res.setHeader('X-Cache', 'OFFLINE');
    res.status(200).json(responseObject);
};
