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

    function swag() {
        return Array.from({ length: 3 }, (_, i) => ({
            "id": 70 + i,
            "url": "https://swag.com",
            "author": "@squirrel on the diary",
            "content": "pikiapi is down rn (BETABAN 3 CAME OUT!!! GO NOW!!!!)",
            "createdAt": "idfk",
            "timestamp": new Date().toISOString(),
            "media": [],
            "likes": 0,
            "comments": 0,
            "isPinned": false,
            "isLocked": false,
            "isReply": false
        }));
    }

    let responseObject = {};

    if (showFields.length > 0) {
        showFields.forEach(field => {
            switch (field) {
                case 'userId':
                    responseObject.userId = 69;
                    break;
                case 'userUrl':
                    responseObject.userUrl = "https://wow.com";
                    break;
                case 'username':
                    responseObject.username = "@squirrel on the diary";
                    break;
                case 'followers':
                    responseObject.followers = 69;
                    break;
                case 'following':
                    responseObject.following = 69;
                    break;
                case 'pfp':
                    responseObject.pfp = "https://images2.minutemediacdn.com/image/upload/c_fill,w_1200,ar_1:1,f_auto,q_auto,g_auto/shape/cover/sport/clown-4-104309a9de96b5c3b380947359b31f69.jpg";
                    break;
                case 'banner':
                    responseObject.banner = "https://images2.minutemediacdn.com/image/upload/c_fill,w_1200,ar_1:1,f_auto,q_auto,g_auto/shape/cover/sport/clown-4-104309a9de96b5c3b380947359b31f69.jpg";
                    break;
                case 'background':
                    responseObject.background = "https://images2.minutemediacdn.com/image/upload/c_fill,w_1200,ar_1:1,f_auto,q_auto,g_auto/shape/cover/sport/clown-4-104309a9de96b5c3b380947359b31f69.jpg";
                    break;
                case 'isVerified':
                    responseObject.isVerified = true;
                    break;
                case 'isInactive':
                    responseObject.isInactive = true;
                    break;
                case 'isAdmin':
                    responseObject.isAdmin = true;
                    break;
                case 'isDonator':
                    responseObject.isDonator = true;
                    break;
                case 'isLive':
                    responseObject.isLive = true;
                    break;
                case 'bio':
                    responseObject.bio = "yea";
                    break;
                case 'loginStreak':
                    responseObject.loginStreak = 35039;
                    break;
                case 'achievementsCount':
                    responseObject.achievementsCount = 34;
                    break;
                case 'achievements':
                    responseObject.achievements = null;
                    break;
                case 'badgeCount':
                    responseObject.badgeCount = 0;
                    break;
                case 'badges':
                    responseObject.badges = [];
                    break;
                case 'posts':
                    responseObject.posts = [
                        {
                            "id": 69,
                            "url": "https://swag.com",
                            "author": "@squirrel on the diary",
                            "content": "pikiapi is down rn (BETABAN 3 CAME OUT!!! GO NOW!!!!)",
                            "createdAt": "idfk",
                            "timestamp": new Date().toISOString(),
                            "media": [],
                            "likes": 0,
                            "comments": 0,
                            "isPinned": false,
                            "isLocked": false,
                            "isReply": false
                        },
                        ...swag()
                    ];
                    break;
                default:
                    break;
            }
        });
    } else {
        responseObject = {
            userId: 69,
            userUrl: "https://wow.com",
            username: "@squirrel on the diary",
            followers: 69,
            following: 69,
            pfp: "https://images2.minutemediacdn.com/image/upload/c_fill,w_1200,ar_1:1,f_auto,q_auto,g_auto/shape/cover/sport/clown-4-104309a9de96b5c3b380947359b31f69.jpg",
            banner: "https://images2.minutemediacdn.com/image/upload/c_fill,w_1200,ar_1:1,f_auto,q_auto,g_auto/shape/cover/sport/clown-4-104309a9de96b5c3b380947359b31f69.jpg",
            background: "https://images2.minutemediacdn.com/image/upload/c_fill,w_1200,ar_1:1,f_auto,q_auto,g_auto/shape/cover/sport/clown-4-104309a9de96b5c3b380947359b31f69.jpg",
            isVerified: true,
            isInactive: true,
            isAdmin: true,
            isDonator: true,
            isLive: true,
            bio: "yea",
            loginStreak: 35039,
            achievementsCount: 34,
            achievements: null,
            badgeCount: 0,
            badges: [],
            posts: [
                {
                    "id": 69,
                    "url": "https://swag.com",
                    "author": "@squirrel on the diary",
                    "content": "pikiapi is down rn (BETABAN 3 CAME OUT!!! GO NOW!!!!)",
                    "createdAt": "idfk",
                    "timestamp": new Date().toISOString(),
                    "media": [],
                    "likes": 0,
                    "comments": 0,
                    "isPinned": false,
                    "isLocked": false,
                    "isReply": false
                },

                ...swag()
            ]
        };
    }

    res.setHeader('X-Cache', 'OFFLINE');
    res.status(200).json(responseObject);
};
