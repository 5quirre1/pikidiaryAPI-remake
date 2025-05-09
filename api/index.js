/*
 *  ================================================
 *  -------------PIKIDIARY API REMAKE---------------
 *           CODE BY SQUIRREL GAY ACORNS!!
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

module.exports = (req, res) => {
    const { query } = req;
    const username = query.username;
    const showFields = query.show ? query.show.split(',').map(field => field.trim()) : [];
    const specificPostId = query.post_id;

    const baseUrl = 'https://pikidiary.lol';
    const url = `${baseUrl}/@${username}`;

    if (!username) {
        res.status(400).json({ error: 'username is required' });
        return;
    }

    const fetchData = (url, headers) => {
        return new Promise((resolve, reject) => {
            const options = {
                method: 'GET',
                headers: headers,
            };

            const request = https.get(url, options, (response) => {
                const { statusCode } = response;

                if (statusCode === 200) {
                    let data = '';
                    response.on('data', (chunk) => {
                        data += chunk;
                    });

                    response.on('end', () => {
                        resolve(data);
                    });
                } else {
                    reject({ statusCode });
                }
            });

            request.on('error', (error) => {
                reject(error);
            });
        });
    };

    // have to do this or it won't work, doesn't matter really, everyone already has your ip :p
    const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    const headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; pikidiaryapi; +https://pikidiary-api.vercel.app/)',
        'X-Forwarded-For': userIp,
        'X-Real-IP': userIp,
        'Referer': baseUrl,
        'Connection': 'keep-alive',
    };

    fetchData(url, headers)
        .then(data => {
            try {
                const $ = cheerio.load(data);

                const usernameSpan = $('span[style="font-size: 18px; line-height: 12px; font-weight: bold; overflow-wrap: anywhere;"]');
                const extractedUsername = usernameSpan.text().trim();

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
                const avatarImg = $('.avatar-cont .avatar');
                if (avatarImg.length > 0) {
                    const relativePfpPath = avatarImg.attr('src');
                    if (relativePfpPath) {
                        pfpUrl = `${baseUrl}${relativePfpPath}`;
                    }
                }

                let isVerified = false;
                const verifiedImage = usernameSpan.parent().find('img[src="/img/icons/verified.png"]');
                if (verifiedImage.length > 0) {
                    isVerified = true;
                }

                let userBio = null;
                const bioDiv = $('.bio');
                if (bioDiv.length > 0) {
                    userBio = bioDiv.html().trim();
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

                const badgeImages = usernameSpan.find('img[title^="Badge:"]');
                badgeImages.each((index, imgElement) => {
                    const badgeImg = $(imgElement);
                    const iconUrl = badgeImg.attr('src') ? `${baseUrl}${badgeImg.attr('src')}` : null;
                    const titleText = badgeImg.attr('title');

                    if (titleText && titleText.startsWith('Badge: ')) {
                        const parts = titleText.substring('Badge: '.length).split(' - ');
                        const name = parts[0] ? parts[0].trim() : null;
                        const description = parts.length > 1 ? parts.slice(1).join(' - ').trim() : null;

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

                const posts = [];
                $('.post').each((index, element) => {
                    const post = $(element);
                    const postId = post.attr('id');
                    const postUrl = postId ? `${baseUrl}/posts/${postId}` : null;
                    const authorName = post.find('.post-name').text().trim();
                    const postContent = post.find('.post-content > span').text().trim();
                    const timestamp = post.find('span[title]').attr('title');

                    const imageElements = post.find('.post-content img');
                    const images = imageElements.map((i, img) => {
                        return $(img).attr('src');
                    }).get();

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
                            default:
                                break;
                        }
                    });
                } else {
                    responseObject = {
                        userUrl: url,
                        username: extractedUsername,
                        followers: followersCount,
                        following: followingCount,
                        pfp: pfpUrl,
                        isVerified: isVerified,
                        bio: userBio,
                        loginStreak: loginStreak,
                        achievementsCount: achievementsCount,
                        achievements: achievementsList,
                        badgeCount: badgeCount,
                        badges: badgesList,
                        posts: posts.slice(0, 4),
                    };
                }

                res.status(200).json(responseObject);

            } catch (error) {
                console.error("error parsing html or extracting data:", error);
                res.status(500).json({ error: 'failed to extract user data' });
            }
        })
        .catch(error => {
            if (error.statusCode) {
                res.status(error.statusCode).json({ error: `failed to retrieve data. status code: ${error.statusCode}` });
            } else {
                res.status(500).json({ error: error.message });
            }
        });
};
