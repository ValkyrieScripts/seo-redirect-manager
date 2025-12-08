-- SEO Tool Blocking Script
-- Blocks known SEO crawler user agents, allows search engine bots

local user_agent = ngx.var.http_user_agent or ""

-- Convert to lowercase for case-insensitive matching
local ua_lower = string.lower(user_agent)

-- List of blocked SEO tool user agents (lowercase)
local blocked_agents = {
    "ahrefsbot",
    "mj12bot",          -- Majestic
    "semrushbot",
    "dotbot",           -- Moz
    "blexbot",
    "dataforseobot",
    "serpstatbot",
    "screaming frog",
    "seokicks",
    "sistrix",
    "linkdexbot",
    "spyfu",
    "rogerbot",
    "exabot",
    "gigabot",
    "ia_archiver",
    "alexa",
    "majestic",
    "opensiteexplorer",
    "cognitiveseo",
    "linkresearchtools",
    "seomoz",
    "backlinkcrawler",
    "domain re-animator",
    "netestate ne crawler",
    "seobility",
    "siteexplorer",
    "seznambot",        -- Czech search engine but often used for scraping
}

-- List of allowed bots (search engines we want to pass juice to)
local allowed_agents = {
    "googlebot",
    "bingbot",
    "slurp",            -- Yahoo
    "duckduckbot",
    "baiduspider",
    "yandexbot",
    "facebot",
    "facebookexternalhit",
    "twitterbot",
    "linkedinbot",
    "pinterest",
    "whatsapp",
    "telegrambot",
    "applebot",
}

-- Check if user agent contains any allowed bot identifier
local function is_allowed_bot()
    for _, allowed in ipairs(allowed_agents) do
        if string.find(ua_lower, allowed, 1, true) then
            return true
        end
    end
    return false
end

-- Check if user agent contains any blocked bot identifier
local function is_blocked_bot()
    for _, blocked in ipairs(blocked_agents) do
        if string.find(ua_lower, blocked, 1, true) then
            return true
        end
    end
    return false
end

-- If it's an allowed bot, let it through
if is_allowed_bot() then
    return
end

-- If it's a blocked bot, return 404
if is_blocked_bot() then
    ngx.log(ngx.NOTICE, "Blocked SEO bot: " .. user_agent)
    ngx.exit(ngx.HTTP_NOT_FOUND)
    return
end

-- For all other user agents (regular browsers, unknown bots), allow through
-- This ensures real users can see the redirect
