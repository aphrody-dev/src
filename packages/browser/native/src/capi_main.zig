// C ABI over the Lightpanda Zig browser core (`browser_capi.dll` / `libbrowser_capi.so`).
// Contract mirrored by `crates/core-capi/include/aphrody_zig.h` and `packages/browser/src/index.ts`.
const std = @import("std");

pub const LP_ABI_VERSION: u32 = 1;
const alloc = std.heap.c_allocator;

fn cstrSlice(p: ?[*:0]const u8) []const u8 {
    if (p) |ptr| return std.mem.span(ptr);
    return "";
}

fn toOwnedCString(bytes: []const u8) ?[*:0]u8 {
    const buf = alloc.alloc(u8, bytes.len + 1) catch return null;
    @memcpy(buf[0..bytes.len], bytes);
    buf[bytes.len] = 0;
    return @ptrCast(buf.ptr);
}

fn appendJsonEscaped(out: *std.ArrayList(u8), s: []const u8) !void {
    try out.append(alloc, '"');
    for (s) |c| {
        switch (c) {
            '"' => try out.appendSlice(alloc, "\\\""),
            '\\' => try out.appendSlice(alloc, "\\\\"),
            '\n' => try out.appendSlice(alloc, "\\n"),
            '\r' => try out.appendSlice(alloc, "\\r"),
            '\t' => try out.appendSlice(alloc, "\\t"),
            else => {
                if (c < 0x20) {
                    var tmp: [6]u8 = undefined;
                    const hex = try std.fmt.bufPrint(&tmp, "\\u{x:0>4}", .{c});
                    try out.appendSlice(alloc, hex);
                } else {
                    try out.append(alloc, c);
                }
            },
        }
    }
    try out.append(alloc, '"');
}

export fn lp_abi_version() callconv(.c) u32 {
    return LP_ABI_VERSION;
}

export fn lp_free(p: ?[*]u8) callconv(.c) void {
    if (p) |ptr| std.c.free(ptr);
}

export fn lp_capabilities_json() callconv(.c) ?[*:0]u8 {
    return toOwnedCString("{\"abi\":1,\"engine\":\"lightpanda-zig\",\"v8\":\"aphrody-v8\",\"features\":[\"extract_title\",\"normalize_url\",\"cdp\",\"mcp\"]}");
}

fn indexOfIgnoreCase(haystack: []const u8, needle: []const u8) ?usize {
    if (needle.len == 0) return 0;
    if (haystack.len < needle.len) return null;
    var i: usize = 0;
    while (i + needle.len <= haystack.len) : (i += 1) {
        if (std.ascii.eqlIgnoreCase(haystack[i .. i + needle.len], needle)) return i;
    }
    return null;
}

export fn lp_extract_title_json(html: ?[*:0]const u8) callconv(.c) ?[*:0]u8 {
    const s = cstrSlice(html);
    var title: []const u8 = "";
    if (indexOfIgnoreCase(s, "<title")) |open_idx| {
        if (std.mem.indexOfScalarPos(u8, s, open_idx, '>')) |gt_idx| {
            const content_start = gt_idx + 1;
            if (indexOfIgnoreCase(s[content_start..], "</title>")) |rel_end| {
                title = std.mem.trim(u8, s[content_start .. content_start + rel_end], " \t\r\n");
            }
        }
    }
    var out: std.ArrayList(u8) = .empty;
    defer out.deinit(alloc);
    out.appendSlice(alloc, "{\"title\":") catch return null;
    appendJsonEscaped(&out, title) catch return null;
    out.append(alloc, '}') catch return null;
    return toOwnedCString(out.items);
}

export fn lp_normalize_url_json(url: ?[*:0]const u8) callconv(.c) ?[*:0]u8 {
    const raw = std.mem.trim(u8, cstrSlice(url), " \t\r\n");
    var out: std.ArrayList(u8) = .empty;
    defer out.deinit(alloc);
    out.appendSlice(alloc, "{\"url\":") catch return null;
    if (std.mem.indexOf(u8, raw, "://") != null or raw.len == 0) {
        appendJsonEscaped(&out, raw) catch return null;
    } else {
        var combined: std.ArrayList(u8) = .empty;
        defer combined.deinit(alloc);
        combined.appendSlice(alloc, "https://") catch return null;
        combined.appendSlice(alloc, raw) catch return null;
        appendJsonEscaped(&out, combined.items) catch return null;
    }
    out.append(alloc, '}') catch return null;
    return toOwnedCString(out.items);
}
