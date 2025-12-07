-- Dynamic redirect handler for OpenResty
-- This script fetches redirect rules from the backend API and caches them

local http = require "resty.http"
local cjson = require "cjson"

local _M = {}

-- Configuration
local BACKEND_URL = os.getenv("BACKEND_URL") or "http://backend:3001"
local CACHE_TTL = 300 -- 5 minutes
local cache = ngx.shared.redirects_cache

-- Fetch redirects from backend
local function fetch_redirects()
    local httpc = http.new()
    httpc:set_timeout(5000)

    local res, err = httpc:request_uri(BACKEND_URL .. "/api/nginx/map.json", {
        method = "GET",
        headers = {
            ["Content-Type"] = "application/json",
        }
    })

    if not res then
        ngx.log(ngx.ERR, "Failed to fetch redirects: ", err)
        return nil
    end

    if res.status ~= 200 then
        ngx.log(ngx.ERR, "Backend returned status: ", res.status)
        return nil
    end

    return cjson.decode(res.body)
end

-- Get redirects (with caching)
local function get_redirects()
    local cached = cache:get("redirects")
    if cached then
        return cjson.decode(cached)
    end

    local redirects = fetch_redirects()
    if redirects then
        cache:set("redirects", cjson.encode(redirects), CACHE_TTL)
    end

    return redirects
end

-- Find matching redirect
function _M.find_redirect()
    local host = ngx.var.host:gsub("^www%.", ""):lower()
    local uri = ngx.var.uri

    local redirects = get_redirects()
    if not redirects then
        return nil
    end

    local domain_rules = redirects[host]
    if not domain_rules then
        return nil
    end

    -- Check each rule
    for _, rule in ipairs(domain_rules) do
        if rule.regex then
            -- Regex match
            local match = ngx.re.match(uri, rule.path)
            if match then
                local target = ngx.re.sub(uri, rule.path, rule.target)
                return target, rule.code
            end
        else
            -- Exact match or catch-all
            if rule.path == "/*" then
                return rule.target, rule.code
            elseif uri == rule.path then
                return rule.target, rule.code
            end
        end
    end

    return nil
end

-- Main handler
function _M.handle()
    local target, code = _M.find_redirect()

    if target then
        -- Increment hit counter (fire and forget)
        -- Could add async call to backend to track hits

        return ngx.redirect(target, code or 301)
    end

    -- No redirect found
    ngx.status = 404
    ngx.header.content_type = "text/html"
    ngx.say("<html><body><h1>404 Not Found</h1></body></html>")
    return ngx.exit(404)
end

-- Clear cache (can be called via API)
function _M.clear_cache()
    cache:flush_all()
    ngx.say("Cache cleared")
end

return _M
