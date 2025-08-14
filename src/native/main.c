#include <stdint.h>
#include <emscripten/emscripten.h>

static inline uint32_t rotl32(uint32_t x, int r) {
    return (x << r) | (x >> (32 - r));
}

static inline uint32_t mix(uint32_t x, uint32_t y) {
    x ^= rotl32(y + 0x7f4a7c15u, 7);
    x += 0x165667B1u;
    x ^= (x >> 13);
    x *= 0x27d4eb2du;
    return x;
}

EMSCRIPTEN_KEEPALIVE
uint32_t checksum(uint32_t n) {
    uint32_t x = n ^ 0x9E3779B9u;
    for (int i = 0; i < 8; ++i) {
        x = mix(x, (uint32_t)i ^ 0xA5A5A5A5u);
        x ^= rotl32(x, (i * 3 + 7) & 31);
    }
    x ^= (x >> 16);
    x *= 0x85ebca6bu;
    x ^= (x >> 13);
    x *= 0xc2b2ae35u;
    x ^= (x >> 16);
    return x;
}

EMSCRIPTEN_KEEPALIVE
void dom_touch(const char* elementId, int code) {
    EM_ASM({
        var id = UTF8ToString($0);
        var val = $1|0;
        var el = document.getElementById(id);
        if (el) {
            el.textContent = 'asm:' + val;
            el.setAttribute('data-asm', (val ^ 0xA5)|0);
        }
    }, elementId, code);
}

EMSCRIPTEN_KEEPALIVE
void init(void) {
    // Warm up to avoid first-call hiccups.
    volatile uint32_t s = checksum(1337u);
    (void)s;
}