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

const https = require('https');
const cheerio = require('cheerio');
const querystring = require('querystring');

const cache = new Map();
const CACHE_TTL = 7 * 60 * 1000; // 7 minutes cache to not destroy pikidiary server

const generateCacheKey = (username, showFields, specificPostId) => {
    return `${username}:${showFields.join(',')}:${specificPostId || ''}`;
};

module.exports = (req, res) => {
    const { query } = req;
    const username = query.username;
    const showFields = query.show ? query.show.split(',').map(field => field.trim()) : [];
    const specificPostId = query.post_id;

    res.setHeader('Access-Control-Allow-Origin', '*');

    const baseUrl = 'https://pikidiary.lol';
    let url = `${baseUrl}/@${username}`;

    if (username == 'pikiapi') {
        url += "?tab=me"; // since it's logged in, it's just collecting the following page; so it reads from ?tab=me :P
    }

    if (!username) {
        res.status(400).json({ error: 'username is required' });
        return;
    }

    // cache
    const cacheKey = generateCacheKey(username, showFields, specificPostId);
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse) {
        // use cache
        const { data, timestamp } = cachedResponse;
        const now = Date.now();

        if (now - timestamp < CACHE_TTL) {
            res.status(200).json(data);
            return;
        } else {
            // remove cache entry
            cache.delete(cacheKey);
        }
    }

    const fetchData = (url, headers, method = 'GET', postData = null) => {
        return new Promise((resolve, reject) => {
            const options = {
                method: method,
                headers: headers,
            };

            const request = https.request(url, options, (response) => {
                const { statusCode, headers: responseHeaders } = response;

                if (statusCode === 404) {
                    reject({ statusCode: 404, message: 'user not found' });
                    return;
                }

                let data = '';
                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    resolve({
                        statusCode,
                        headers: responseHeaders,
                        data
                    });
                });
            });

            request.on('error', (error) => {
                reject(error);
            });

            if (postData) {
                request.write(postData);
            }

            request.end();
        });
    };

    const email = process.env.email;
    const password = process.env.password;

    // have to do this or it won't work, doesn't matter really, everyone already has your ip :p
    const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    const standardHeaders = {
        'User-Agent': 'Mozilla/5.0 (compatible; pikidiaryapi; +https://pikidiary-api.vercel.app/)',
        'X-Forwarded-For': userIp,
        'X-Real-IP': userIp,
        'Referer': baseUrl,
        'Connection': 'keep-alive',
    };

    let authenticatedHeaders;

    const authenticateAndFetchData = async () => {
        try {
            const loginPageResponse = await fetchData(`${baseUrl}/login`, standardHeaders);
            const loginPage$ = cheerio.load(loginPageResponse.data);
            const csrfToken = loginPage$('input[name="csrf_token"]').val() || '';

            const loginData = querystring.stringify({
                email: email,
                password: password,
                csrf_token: csrfToken
            });

            const loginHeaders = {
                ...standardHeaders,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(loginData)
            };

            const loginResponse = await fetchData(`${baseUrl}/login`, loginHeaders, 'POST', loginData);
            const cookies = loginResponse.headers['set-cookie'];

            if (!cookies) {
                throw new Error('login failed');
            }

            authenticatedHeaders = {
                ...standardHeaders,
                'Cookie': cookies.join('; ')
            };

            const userPageResponse = await fetchData(url, authenticatedHeaders);

            if (userPageResponse.data.includes('User not found')) {
                res.status(404).json({ error: 'user not found' });
                return;
            }

            let userId = await extractUserId(userPageResponse.data);

            if (username === 'pikiapi') {
                userId = 4151;
            }

            processUserPage(userPageResponse.data, userId);

        } catch (error) {
            if (error.statusCode === 404) {
                res.status(404).json({ error: 'user not found' });
                return;
            }
            console.error("auth or data fetch error: ", error);
            res.status(500).json({ error: error.message || 'failed to auth or fetch data' });
        }
    };

    const extractUserId = async (html) => {
        const $ = cheerio.load(html);
        let userId = 0;
        $('form').each((index, element) => {
            const form = $(element);
            const action = form.attr('action');
            if (action && action.startsWith('/block/')) {
                userId = parseInt(action.split('/')[2], 10);
                return false;
            }
        });
        return userId;
    };

    const processUserPage = async (data, userId) => {
        try {
            const $ = cheerio.load(data);

            if (data.includes('User not found')) {
                res.status(404).json({ error: 'user not found' });
                return;
            }

            const usernameSpan = $('span[style="font-size: 18px; line-height: 12px; font-weight: bold; overflow-wrap: anywhere;"]');
            const extractedUsername = usernameSpan.text().trim();

            if (!extractedUsername) {
                res.status(404).json({ error: 'user not found' });
                return;
            }

            const avatarImg = $('.avatar-cont .avatar');

            let followersCount = null;
            const followersLabel = $('.section-cont .profile-grid-label:contains("Followers")');
            if (followersLabel.length > 0) {
                const followersText = followersLabel.text().trim();
                const match = followersText.match(/\((\d+)\)/);
                if (match && match[1]) {
                    followersCount = parseInt(match[1], 10);
                }
            }

            let followingCount = null;
            const followingLabel = $('.section-cont .profile-grid-label:contains("Following")');
            if (followingLabel.length > 0) {
                const followingText = followingLabel.text().trim();
                const match = followingText.match(/\((\d+)\)/);
                if (match && match[1]) {
                    followingCount = parseInt(match[1], 10);
                }
            }

            let pfpUrl = null;
            if (avatarImg.length > 0) {
                const relativePfpPath = avatarImg.attr('src');
                if (relativePfpPath) {
                    pfpUrl = `${baseUrl}${relativePfpPath}`;
                }
            }

            let bannerUrl = null;
            const profMain = $('.prof-main');
            const bannerImg = profMain.find('img[style*="object-fit: cover; width: 100%; height: 75px; box-sizing: border-box; padding: 2px; background-color: Var(--prof-section-background); border: var(--prof-border) 1px solid;"]');
            if (bannerImg.length > 0) {
                const relativeBannerPath = bannerImg.attr('src');
                if (relativeBannerPath) {
                    bannerUrl = `${baseUrl}${relativeBannerPath}`;
                }
            }

            let isVerified = false;
            const verifiedImage = usernameSpan.find('img[src="/img/icons/verified.png"]');
            if (verifiedImage.length > 0) {
                isVerified = true;
            }

            let isLive = false;
            const liveContainer = profMain.find('div[style*="width: 100%; min-height: 80px; border: 1px solid #D02222; box-sizing: border-box; position: relative;"]');
            if (liveContainer.length > 0) {
                isLive = true;
            }

            /*
             * =============================================
             * This was added in by mpax235
             * =============================================
             */

            let isAdmin = false;
            const adminImage = usernameSpan.find('img[src="/img/icons/admin.png"]');
            if (adminImage.length > 0) {
                isAdmin = true;
            }

            let isDonator = false;
            const donatorImage = usernameSpan.find('img[src="/img/icons/donator.png"]');
            if (donatorImage.length > 0) {
                isDonator = true;
            }

            /* ============================================= */

            let userBio = null;
            const bioDiv = $('.bio');
            if (bioDiv.length > 0) {
                userBio = bioDiv.html().trim();
            }


            // user background showing !!!
            let userBackground = null;
            if (bioDiv.length > 0) {
                const styleTag = bioDiv.find('style');
                if (styleTag.length > 0) {
                    const styleContent = styleTag.html();
                    const backgroundMatch = styleContent.match(/background:\s*([^}]*)/);
                    if (backgroundMatch && backgroundMatch[1]) {
                        userBackground = backgroundMatch[1].trim();

                        if (userBackground.includes('#')) {
                            // color
                            const colorMatch = userBackground.match(/#[a-fA-F0-9]+/);
                            if (colorMatch) {
                                userBackground = colorMatch[0];
                            }
                        } else if (userBackground.includes('url(')) {
                            // background url
                            const urlMatch = userBackground.match(/url\(['"]?(.*?)['"]?\)/);
                            if (urlMatch && urlMatch[1]) {
                                userBackground = urlMatch[1];
                            }
                        }
                    }
                }
            }

            let loginStreak = null;
            const streakContainer = $('div[style*="background: #FFF4E5;"][style*="border: solid 1px #FFA726;"]');
            if (streakContainer.length > 0) {
                const streakNumberElement = streakContainer.find('b[style="font-size: 19px;"]');
                if (streakNumberElement.length > 0) {
                    loginStreak = parseInt(streakNumberElement.text().trim(), 10);
                }
            }

            let achievementsCount = 0;
            const achievementsList = [];

            $('img[style*="width: 44px; height: 44px;"]').each((index, imgElement) => {
                const achievementImg = $(imgElement);
                const achievementDiv = achievementImg.parent('div[style*="display: flex; gap: 8px;"]');

                if (achievementDiv.length > 0) {
                    const nameElement = achievementDiv.find('b[style="font-size: 19px;"]');
                    const descriptionElement = achievementDiv.find('span[style="font-size: 11px;"]');

                    if (nameElement.length > 0 && descriptionElement.length > 0) {
                        const iconUrl = achievementImg.attr('src') ? `${baseUrl}${achievementImg.attr('src')}` : null;
                        const name = nameElement.text().trim();
                        const description = descriptionElement.text().trim();

                        achievementsList.push({
                            name: name,
                            description: description,
                            iconUrl: iconUrl,
                        });
                        achievementsCount++;
                    }
                }
            });

            let badgeCount = 0;
            const badgesList = [];

            const allUserBadges = usernameSpan.find('img');
            allUserBadges.each((index, imgElement) => {
                const badgeImg = $(imgElement);
                const iconUrl = badgeImg.attr('src') ? `${baseUrl}${badgeImg.attr('src')}` : null;
                const titleText = badgeImg.attr('title');

                if (titleText) {
                    let name = null;
                    let description = null;

                    if (titleText.startsWith('Badge: ')) {
                        const parts = titleText.substring('Badge: '.length).split(' - ');
                        name = parts[0] ? parts[0].trim() : null;
                        description = parts.length > 1 ? parts.slice(1).join(' - ').trim() : null;
                    } else {
                        name = titleText.trim();
                        description = null;
                    }

                    if (name) {
                        badgesList.push({
                            name: name,
                            description: description,
                            iconUrl: iconUrl
                        });
                        badgeCount++;
                    }
                }
            });

            const liveInfo = [];
            const liveInfoContainer = liveContainer.find('div[style*="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: fit-content; height: fit-content; text-align: center;"]');

            if (isLive) {
                try {
                    const liveLink = liveInfoContainer.find('a[style*="font-size: 22px; color: #D02222;"]');
                    const ExtractedLiveLink = `${baseUrl}${liveLink.attr('href')}`;
                    const liveId = liveLink.attr('href').slice(6);

                    const livePageResponse = await fetchData(ExtractedLiveLink, authenticatedHeaders);
                    const liveData$ = cheerio.load(livePageResponse.data);

                    const liveTitle = liveData$('#title-text').text().trim();
                    const liveViewCount = parseInt(liveData$('#view-count').text().trim(), 10);

                    // fixed :D
                    let liveDesc = null;
                    const descriptionDiv = liveData$('div.section[style*="flex-shrink: 1; overflow-y: auto; box-sizing: border-box; height: 63px; padding-top: 8px; border-top: 1px solid #CCC; font-size: 12px;"]');

                    if (descriptionDiv.length > 0) {
                        const descText = descriptionDiv.find('div b:contains("Description: ")').parent().text().trim();
                        if (descText) {
                            liveDesc = descText.replace('Description: ', '').trim();
                        }
                    }

                    liveInfo.push({
                        author: username,
                        title: liveTitle,
                        description: liveDesc,
                        views: liveViewCount,
                        link: ExtractedLiveLink,
                        id: liveId
                    });
                }
                catch (error) {
                    console.error("Error fetching live data:", error);
                }

                // too bad skid you cant get ts
                authenticatedHeaders = null;
            }

            const posts = [];
            $('.post').each((index, element) => {
                const post = $(element);
                const postId = post.attr('id');
                const postUrl = postId ? `${baseUrl}/posts/${postId}` : null;
                const authorName = post.find('.post-name').text().trim();
                const postContent = post.find('.post-content > span').text().trim();
                const createdAt = post.find('span[style*="line-height: 11px; margin-top: -1px;"]').text().trim();
                const timestamp = post.find('span[title]').attr('title');

                const imageElements = post.find('.post-content img');
                const images = [];
                imageElements.each((i, img) => {
                    const imgSrc = $(img).attr('src');
                    if (imgSrc.startsWith('/uploads/emotes/')) {
                        images.push({ type: 'emote', url: imgSrc }); // emote (pikidiary emojis)
                    } else {
                        images.push({ type: 'image', url: imgSrc }); // just images
                    }
                });

                const likesCountElement = post.find('.like-count');
                const likesCount = likesCountElement.length > 0 ? parseInt(likesCountElement.text(), 10) : 0;

                const commentsCountElement = post.find('a[href*="/posts/"]');
                const commentsCountText = commentsCountElement.text().trim();
                const commentsMatch = commentsCountText.match(/(\d+)/);
                const commentsCount = commentsMatch ? parseInt(commentsMatch[0], 10) : 0;

                const isPinned = post.find('img[alt="Pinned"]').length > 0;
                const isLocked = post.find('img[alt="Locked"]').length > 0;

                posts.push({
                    id: postId,
                    url: postUrl,
                    author: authorName,
                    content: postContent,
                    createdAt: createdAt,
                    timestamp: timestamp,
                    images: images,
                    likes: likesCount,
                    comments: commentsCount,
                    isPinned: isPinned,
                    isLocked: isLocked
                });
            });

            posts.sort((a, b) => {
                const dateA = new Date(a.timestamp);
                const dateB = new Date(b.timestamp);
                return dateB - dateA;
            });

            let responseObject = {};
            let isInactive = false;
            if (avatarImg.hasClass('inactive')) {
                isInactive = true;
            }

            if (specificPostId) {
                const foundPost = posts.find(post => post.id === specificPostId);
                if (foundPost) {
                    responseObject = foundPost;
                } else {
                    res.status(404).json({ error: `post with ID '${specificPostId}' not found for user '${username}'` });
                    return;
                }
            } else if (showFields.length > 0) {
                showFields.forEach(field => {
                    switch (field) {
                        case 'username':
                            responseObject.username = extractedUsername;
                            break;
                        case 'followers':
                            responseObject.followers = followersCount;
                            break;
                        case 'following':
                            responseObject.following = followingCount;
                            break;
                        case 'pfp':
                            responseObject.pfp = pfpUrl;
                            break;
                        case 'banner':
                            responseObject.banner = bannerUrl;
                            break;
                        case 'background':
                            responseObject.background = userBackground;
                            break;
                        case 'isVerified':
                            responseObject.isVerified = isVerified;
                            break;
                        case 'bio':
                            responseObject.bio = userBio;
                            break;
                        case 'loginStreak':
                            responseObject.loginStreak = loginStreak;
                            break;
                        case 'achievementsCount':
                            responseObject.achievementsCount = achievementsCount;
                            break;
                        case 'achievements':
                            responseObject.achievements = achievementsList;
                            break;
                        case 'badgeCount':
                            responseObject.badgeCount = badgeCount;
                            break;
                        case 'badges':
                            responseObject.badges = badgesList;
                            break;
                        case 'posts':
                            responseObject.posts = posts.slice(0, 4);
                            break;
                        case 'isAdmin':
                            responseObject.isAdmin = isAdmin;
                            break;
                        case 'isDonator':
                            responseObject.isDonator = isDonator;
                            break;
                        case 'isLive':
                            responseObject.isLive = isLive;
                            break;
                        case 'liveInfo':
                            responseObject.liveInfo = liveInfo;
                            break;
                        case 'isInactive':
                            responseObject.isInactive = isInactive;
                            break;
                        default:
                            break;
                    }
                });
            } else {
                if (isLive) {
                    responseObject = {
                        userId: userId,
                        userUrl: url,
                        username: extractedUsername,
                        followers: followersCount,
                        following: followingCount,
                        pfp: pfpUrl,
                        banner: bannerUrl,
                        background: userBackground,
                        isVerified: isVerified,
                        isInactive: isInactive,
                        isAdmin: isAdmin,
                        isDonator: isDonator,
                        isLive: isLive,
                        liveInfo: liveInfo,
                        bio: userBio,
                        loginStreak: loginStreak,
                        achievementsCount: achievementsCount,
                        achievements: achievementsList,
                        badgeCount: badgeCount,
                        badges: badgesList,
                        posts: posts.slice(0, 4),
                    };
                } else {
                    responseObject = {
                        userId: userId,
                        userUrl: url,
                        username: extractedUsername,
                        followers: followersCount,
                        following: followingCount,
                        pfp: pfpUrl,
                        banner: bannerUrl,
                        background: userBackground,
                        isVerified: isVerified,
                        isInactive: isInactive,
                        isAdmin: isAdmin,
                        isDonator: isDonator,
                        isLive: isLive,
                        bio: userBio,
                        loginStreak: loginStreak,
                        achievementsCount: achievementsCount,
                        achievements: achievementsList,
                        badgeCount: badgeCount,
                        badges: badgesList,
                        posts: posts.slice(0, 4),
                    };
                }
            }

            // Store the response in cache
            cache.set(cacheKey, {
                data: responseObject,
                timestamp: Date.now()
            });

            // Add cache header to response
            res.setHeader('X-Cache', 'MISS');
            res.status(200).json(responseObject);

        } catch (error) {
            console.error("error parsing html or extracting data:", error);
            res.status(500).json({ error: 'failed to extract user data' });
        }
    };

    if (email && password) {
        authenticateAndFetchData();
    } else {
        console.warn("auth didn't work, doing normal (less data)");
        fetchData(url, standardHeaders)
            .then(response => {
                if (response.data.includes('User not found')) {
                    res.status(404).json({ error: 'user not found' });
                    return;
                }

                extractUserId(response.data)
                    .then(userId => {
                        if (username === 'pikiapi') {
                            userId = 4151;
                        }
                        processUserPage(response.data, userId);
                    })
                    .catch(err => {
                        console.error("error getting userid:", err);
                        processUserPage(response.data, null);
                    });
            })
            .catch(error => {
                if (error.statusCode === 404) {
                    res.status(404).json({ error: 'user not found' });
                } else if (error.statusCode) {
                    res.status(error.statusCode).json({ error: `failed to retrieve data. status code: ${error.statusCode}` });
                } else {
                    res.status(500).json({ error: error.message });
                }
            });
    }
};
