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
const { encode } = require('punycode');

const cache = new Map();
const CACHE_TTL = 7 * 60 * 1000; // 7 minutes cache to not destroy pikidiary server

const generateCacheKey = (username, showFields) => {
    return `${username}:${showFields.join(',')}`;
};

module.exports = (req, res) => {
    const { query } = req;
    const username = query.username;
    const showFields = query.show ? query.show.split(',').map(field => field.trim()) : [];
    const help = query.help !== undefined;

    res.setHeader('Access-Control-Allow-Origin', '*');

    // a help command so non nerd people can know what to do
    if (help) {
        const helpResponse = {
            status: 200,
            message: "pikiapi",
            version: "1.2.1",
            author: "@squirrel & @hacks.guide & @mpax235",
            usage: {
                endpoint: "/?username=username&show=field",
                parameters: {
                    username: {
                        type: "string",
                        required: true,
                        description: "the username to fetch info for"
                    },
                    show: {
                        type: "string",
                        required: false,
                        description: "to show spicific fields of info, if not specified, returns all available fields"
                    },
                    help: {
                        type: "boolean",
                        required: false,
                        description: "this help message"
                    }
                },
                availableFields: [
                    "username", "followers", "following", "pfp", "banner", "background",
                    "isVerified", "isAdmin", "isBot", "isClub", "isInactive", "bio", "loginStreak",
                    "achievementsCount", "achievements", "badgeCount", "badges", "posts", "pinned",
                    "userId", "isLive", "liveInfo", "sectionOrder"
                ],
                examples: [
                    "/?username=exampleuser",
                    "/?username=exampleuser&show=username,followers,pfp",
                    "/?help"
                ],
                cache: {
                    ttl: "7 minutes",
                    description: "responses are cached for 7 minutes to make sure piki's server aren't being affected"
                },
                rateLimit: "please be respectful with requests to avoid overloading piki's servers",
                disclaimer: "this is not an offical api. pikidiary.lol is owned by jax, this was made for fun and to recreate an old feature"
            }
        };
        res.status(200).json(helpResponse);
        return;
    }

    const baseUrl = 'https://pikidiary.lol';
    let url = `${baseUrl}/@${username}`;

    if (!username) {
        res.status(400).json({
            status: 400,
            error: 'username is required',
            message: 'put a username to fetch some info, use ?help to show help and docs and stuff'
        });
        return;
    }

    // cache
    const cacheKey = generateCacheKey(username, showFields);
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse) {
        // use cache
        const { data, timestamp } = cachedResponse;
        const now = Date.now();

        if (now - timestamp < CACHE_TTL) {
            res.status(200).json({
                status: 200,
                ...data
            });
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
                    reject({ statusCode: 404, message: `user not found` });
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

    // have to do this or it won't work, doesn't matter really, everyone already has your ip :p
    const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    const standardHeaders = {
        'User-Agent': 'Mozilla/5.0 (compatible; pikidiaryapi; +https://pikidiary-api.vercel.app/)',
        'X-Forwarded-For': userIp,
        'X-Real-IP': userIp,
        'Referer': baseUrl,
        'Connection': 'keep-alive',
    };

    const processUserPage = async (data) => {
        try {
            const $ = cheerio.load(data);

            if (data.includes('User not found')) {
                res.status(404).json({
                    status: 404,
                    error: 'user not found'
                });
                return;
            }

            const usernameSpan = $('span[style="font-size:18px;line-height:12px;font-weight:700;overflow-wrap:anywhere"]');
            const extractedUsername = usernameSpan.text().trim();

            if (!extractedUsername) {
                res.status(404).json({
                    status: 404,
                    error: 'user not found'
                });
                return;
            }

            const avatarImg = $('.avatar-cont .avatar');

            let followersCount = null;
            let followersLabel = 0;
            if (extractedUsername === "IQ") {
                followersLabel = $('.info .profile-grid-label:contains("Followers")');
            } else {
                followersLabel = $('.section-cont .profile-grid-label:contains("Followers")');
            }
            if (followersLabel.length > 0) {
                const followersText = followersLabel.text().trim();
                const match = followersText.match(/\((\d+)\)/);
                if (match && match[1]) {
                    followersCount = parseInt(match[1], 10);
                }
            }

            let followingCount = null;

            if (extractedUsername === "IQ") {
                followingCount = 0;
            }

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
            const bannerImg = profMain.find('img[style*="object-fit:cover;width:100%;height:75px;box-sizing:border-box;padding:2px;background-color:Var(--prof-section-background);border:var(--prof-border) 1px solid"]');
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

            let isClub = false;
            const clubImage = usernameSpan.find('img[src="/img/icons/club.png"]');
            if (clubImage.length > 0) {
                isClub = true;
            }

            let isBot = false;
            const botImage = usernameSpan.find('img[src="/img/icons/robot.png"]');
            if (botImage.length > 0) {
                isBot = true;
            }

            /* ============================================= */

            let userBio = null;
            const bioDiv = $('.bio');
            if (bioDiv.length > 0) {
                userBio = bioDiv.html().trim();
            }

            let encodedUserBio = userBio;
            if (encodedUserBio.length > 0) {
                encodedUserBio = encodedUserBio
                    .replace(/<div\s+class=["']br["']><\/div>/gi, '[br]')
                    .replace(/<img\s+[^>]*src=["']https:\/\/proxy\.pikidiary\.lol\/\?url=([^"']+)["'][^>]*>/gi, (_, encodedUrl) => {
                        const decodedUrl = decodeURIComponent(encodedUrl);
                        return `[img]${decodedUrl}[/img]`;
                    })
                    .replace(/<a\s+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, (_, href, inner) => {
                        const content = inner.trim();
                        return content ? `[url=${href}]${content}[/url]` : `[url=${href}][/url]`;
                    })
                    .replace(/<marquee[^>]*>(.*?)<\/marquee>/gi, (_, content) => {
                        return `[marquee]${content.trim()}[/marquee]`;
                    })
                    .replace(/<style>body,body\.dark\{cursor:url\((?:https:\/\/bitview\.lol\?url=)?(https[^)]+)\),auto\}<\/style>/gi, (_, cursorUrl) => {
                        return `[style=cursor]${cursorUrl}[/style]`;
                    })
                    .replace(/<style>body,body\.dark\{background:url\((?:https:\/\/bitview\.lol\?url=)?(https[^)]+)\)\s*repeat\s+fixed\}<\/style>/gi, (_, bgUrl) => {
                        return `[style=bg]${bgUrl}[/style]`;
                    })
                    .replace(/<audio[^>]*src=["']https:\/\/proxy\.pikidiary\.lol\/\?url=([^"']+)["'][^>]*><\/audio>/gi, (_, encodedUrl, offset, fullTag) => {
                        const decodedUrl = decodeURIComponent(encodedUrl);
                        const hasLoop = fullTag.includes('loop');
                        const hasAutoplay = fullTag.includes('autoplay');

                        if (hasLoop && hasAutoplay) {
                            return `[music=loop,autoplay]${decodedUrl}[/music]`;
                        } else if (hasLoop) {
                            return `[music=loop]${decodedUrl}[/music]`;
                        } else if (hasAutoplay) {
                            return `[music=autoplay]${decodedUrl}[/music]`;
                        } else {
                            return `[music]${decodedUrl}[/music]`;
                        }
                    })
                    .replace(/<span\s+style=["']font-size:\s*13px;\s*line-height:\s*14px["']>(.*?)<\/span>/gi, (_, content) => {
                        return `[small]${content.trim()}[/small]`;
                    })
                    .replace(/<s>(.*?)<\/s>/gi, (_, content) => {
                        return `[s]${content.trim()}[/s]`;
                    })
                    .replace(/<strong>(.*?)<\/strong>/gi, (_, content) => {
                        return `[b]${content.trim()}[/b]`;
                    })
                    .replace(/<em>(.*?)<\/em>/gi, (_, content) => {
                        return `[i]${content.trim()}[/i]`;
                    })
                    .replace(/<u>(.*?)<\/u>/gi, (_, content) => {
                        return `[u]${content.trim()}[/u]`;
                    });
            }


            // user background showing !!!
            let userBackground = null;
            if (bioDiv.length > 0) {
                const styleTag = bioDiv.find('style');
                if (styleTag.length > 0) {
                    for (let i = 0; i < styleTag.length; i++) {
                        const styleContent = styleTag.eq(i).html();
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
            }

            let loginStreak = null;
            const streakContainer = $('div[style*="background:#fff4e5;"][style*="border:solid 1px #ffa726;"]');
            if (streakContainer.length > 0) {
                const streakNumberElement = streakContainer.find('b[style="font-size:19px"]');
                if (streakNumberElement.length > 0) {
                    loginStreak = parseInt(streakNumberElement.text().trim(), 10);
                }
            }

            let sectionOrder = null;
            const scriptTags = $('script');
            scriptTags.each((index, script) => {
                const scriptContent = $(script).html();
                const sectionOrderMatch = scriptContent.match(/let sectionOrder=(\[.*?\]);/);
                if (sectionOrderMatch && sectionOrderMatch[1]) {
                    try {
                        sectionOrder = JSON.parse(sectionOrderMatch[1]);
                    } catch (e) {
                        console.error("failed to parse sectionorder:", e);
                    }
                }
            });

            let achievementsCount = 0;
            const achievementsList = [];

            $('img[style*="width:44px;height:44px;box-sizing:border-box;border:solid 1px #ccc;padding:2px"]').each((index, imgElement) => {
                const achievementImg = $(imgElement);
                const achievementDiv = achievementImg.parent('div[style*="display:flex;gap:8px"]');

                if (achievementDiv.length > 0) {
                    const nameElement = achievementDiv.find('b[style="font-size:19px"]');
                    const descriptionElement = achievementDiv.find('span[style="font-size:11px"]');

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

            const posts = [];
            const pinnedPosts = [];

            $('.post').each((index, element) => {
                const post = $(element);
                const postId = post.attr('id');
                const postUrl = postId ? `${baseUrl}/posts/${postId}` : null;
                const authorName = post.find('.post-name').text().trim();
                const rawPostContent = post.find('.post-content > span').html() || 'Post Content cannot be found.';
                const postContent = rawPostContent
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/\/uploads\/emotes/gi, 'https://allowcors.nomaakip.workers.dev/?url=https://pikidiary.lol/uploads/emotes')
                    .trim();
                const createdAt = post.find('span[style*="line-height:11px;margin-top:-1px"]').text().trim();
                const timestamp = post.find('span[title]').attr('title');

                const media = [];

                // image
                const imageElements = post.find('.post-content img');
                imageElements.each((i, img) => {
                    const imgSrc = $(img).attr('src');
                    if (imgSrc.startsWith('/uploads/emotes/')) {
                        media.push({ type: 'emote', url: imgSrc }); // emote (pikidiary emojis)
                    } else {
                        media.push({ type: 'image', url: imgSrc }); // images
                    }
                });

                // video
                const videoElements = post.find('.post-content video source, .post-content video');
                videoElements.each((i, element) => {
                    const videoSrc = $(element).attr('src');
                    if (videoSrc) {
                        media.push({ type: 'video', url: videoSrc }); // videos
                    }
                });

                const likesCountElement = post.find('.like-count');
                const likesCount = likesCountElement.length > 0 ? parseInt(likesCountElement.text(), 10) : 0;

                // acutally make comment count work KMFAO
                const commentsCountElement = post.find('a.post-button[href*="/posts/"] img[src="/img/icons/comment.png"]').parent();
                let commentsCount = 0;
                if (commentsCountElement.length > 0) {
                    const commentsText = commentsCountElement.text().trim();
                    // get count
                    const commentsMatch = commentsText.match(/(\d+)$/);
                    commentsCount = commentsMatch ? parseInt(commentsMatch[0], 10) : 0;
                }

                const isPinned = post.find('img[alt="Pinned"]').length > 0;
                const isLocked = post.find('img[src="/img/icons/locked.png"]').length > 0;
                const isReply = post.find('img[src="/img/icons/parent.png"]').length > 0;
                let parentId = null;
                if (isReply) {
                    const parentLink = post.find('a.post-button img[src="/img/icons/parent.png"]').parent();
                    if (parentLink.length > 0) {
                        const href = parentLink.attr('href');
                        if (href) {
                            parentId = href.split('/posts/')[1].split('#')[0];
                        }
                    }
                }

                const postData = {
                    id: postId,
                    url: postUrl,
                    author: authorName,
                    content: postContent,
                    createdAt: createdAt,
                    timestamp: timestamp,
                    media: media,
                    likes: likesCount,
                    isLocked: isLocked,
                    isReply: isReply
                };

                if (isReply) {
                    postData.replyInfo = {
                        parentId: parentId,
                        url: `${baseUrl}/posts/${parentId}`
                    };
                } else {
                    // add comment count to non reply posts
                    postData.comments = commentsCount;
                }

                // make it so pinned posts are seperate
                if (isPinned) {
                    pinnedPosts.push(postData);
                } else {
                    posts.push(postData);
                }
            });

            posts.sort((a, b) => {
                const dateA = new Date(a.timestamp);
                const dateB = new Date(b.timestamp);
                return dateB - dateA;
            });

            pinnedPosts.sort((a, b) => {
                const dateA = new Date(a.timestamp);
                const dateB = new Date(b.timestamp);
                return dateB - dateA;
            });

            let responseObject = {
                status: 200
            };
            let isInactive = false;
            if (avatarImg.hasClass('inactive')) {
                isInactive = true;
            }

            if (showFields.length > 0) {
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
                            responseObject.bio = encodedUserBio;
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
                            responseObject.posts = posts.slice(0, 6);
                            break;
                        case 'pinned':
                            responseObject.pinned = pinnedPosts;
                            break;
                        case 'isAdmin':
                            responseObject.isAdmin = isAdmin;
                            break;
                        case 'isBot':
                            responseObject.isBot = isBot;
                            break;
                        case 'isClub':
                            responseObject.isClub = isClub;
                            break;
                        case 'isInactive':
                            responseObject.isInactive = isInactive;
                            break;
                        case 'userId':
                            responseObject.userId = "due to TOS, we can not get this right now.";
                            break;
                        case 'isLive':
                            responseObject.isLive = "due to TOS, we can not get this right now.";
                            break;
                        case 'liveInfo':
                            responseObject.liveInfo = "due to TOS, we can not get this right now.";
                            break;
                        case 'sectionOrder':
                            responseObject.sectionOrder = sectionOrder;
                            break;
                        default:
                            break;
                    }
                });
            } else {
                responseObject = {
                    status: 200,
                    userId: "due to TOS, we can not get this right now.",
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
                    isBot: isBot,
                    isClub: isClub,
                    isLive: "due to TOS, we can not get this right now.",
                    bio: encodedUserBio,
                    loginStreak: loginStreak,
                    achievementsCount: achievementsCount,
                    achievements: achievementsList,
                    sectionOrder: sectionOrder,
                    badgeCount: badgeCount,
                    badges: badgesList,
                    pinned: pinnedPosts,
                    posts: posts.slice(0, 6), // was gonna change this to recent posts but things that are using pikiapi for posts would break so uh some other time
                };
            }

            // Store the response in cache (without status field)
            const cacheData = { ...responseObject };
            delete cacheData.status;

            cache.set(cacheKey, {
                data: cacheData,
                timestamp: Date.now()
            });

            // Add cache header to response
            res.setHeader('X-Cache', 'MISS');
            res.status(200).json(responseObject);

        } catch (error) {
            console.error("error parsing html or extracting data:", error);
            res.status(500).json({
                status: 500,
                error: 'failed to extract user data'
            });
        }
    };

    fetchData(url, standardHeaders)
        .then(response => {
            if (response.data.includes('User not found')) {
                res.status(404).json({
                    status: 404,
                    error: 'user not found'
                });
                return;
            }

            processUserPage(response.data);
        })
        .catch(error => {
            if (error.statusCode === 404) {
                res.status(404).json({
                    status: 404,
                    error: 'user not found'
                });
            } else if (error.statusCode) {
                res.status(error.statusCode).json({
                    status: error.statusCode,
                    error: `failed to retrieve data. status code: ${error.statusCode}`
                });
            } else {
                res.status(500).json({
                    status: 500,
                    error: error.message
                });
            }
        });
};
