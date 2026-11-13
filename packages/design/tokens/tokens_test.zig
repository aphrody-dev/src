// Compilé en CI (ci.yml) : `zig test packages/design/tokens/tokens_test.zig`.
const std = @import("std");
const t = @import("tokens.zig");

test "tokens.zig : primaire de marque et toutes les déclarations" {
    try std.testing.expectEqual(@as(u32, 0x1242FFFF), t.light.primary);
    try std.testing.expectEqual(@as(u32, 0xBAC3FFFF), t.dark.primary);
    try std.testing.expectEqual(@as(u32, 0xBA1A1AFF), t.light.@"error");
    std.testing.refAllDecls(t);
}
