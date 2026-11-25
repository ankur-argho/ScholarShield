import { describe, it, expect } from "vitest";
import { isPrivateOrReservedIp, validateSafeUrl } from "../lib/scraper";
describe("SSRF Protection Suite", () => {
    describe("isPrivateOrReservedIp", () => {
        it("detects IPv4 loopback addresses", () => {
            expect(isPrivateOrReservedIp("127.0.0.1")).toBe(true);
            expect(isPrivateOrReservedIp("127.0.0.2")).toBe(true);
            expect(isPrivateOrReservedIp("127.255.255.254")).toBe(true);
            expect(isPrivateOrReservedIp("0.0.0.0")).toBe(true);
            expect(isPrivateOrReservedIp("localhost")).toBe(true);
        });
        it("detects IPv6 loopback and unspecified addresses", () => {
            expect(isPrivateOrReservedIp("::1")).toBe(true);
            expect(isPrivateOrReservedIp("[::1]")).toBe(true);
            expect(isPrivateOrReservedIp("0:0:0:0:0:0:0:1")).toBe(true);
            expect(isPrivateOrReservedIp("::")).toBe(true);
        });
        it("detects IPv4-mapped IPv6 loopback and private addresses", () => {
            expect(isPrivateOrReservedIp("::ffff:127.0.0.1")).toBe(true);
            expect(isPrivateOrReservedIp("[::ffff:127.0.0.1]")).toBe(true);
            expect(isPrivateOrReservedIp("::ffff:7f00:1")).toBe(true); // 127.0.0.1 in hex
            expect(isPrivateOrReservedIp("::ffff:10.0.0.1")).toBe(true);
            expect(isPrivateOrReservedIp("::ffff:192.168.1.1")).toBe(true);
            expect(isPrivateOrReservedIp("::ffff:169.254.169.254")).toBe(true);
        });
        it("detects RFC1918 private subnets", () => {
            // 10.0.0.0/8
            expect(isPrivateOrReservedIp("10.0.0.1")).toBe(true);
            expect(isPrivateOrReservedIp("10.255.255.254")).toBe(true);
            // 172.16.0.0/12
            expect(isPrivateOrReservedIp("172.16.0.1")).toBe(true);
            expect(isPrivateOrReservedIp("172.24.10.5")).toBe(true);
            expect(isPrivateOrReservedIp("172.31.255.254")).toBe(true);
            expect(isPrivateOrReservedIp("172.32.0.1")).toBe(false); // Public
            // 192.168.0.0/16
            expect(isPrivateOrReservedIp("192.168.0.1")).toBe(true);
            expect(isPrivateOrReservedIp("192.168.100.50")).toBe(true);
            expect(isPrivateOrReservedIp("192.169.1.1")).toBe(false); // Public
        });
        it("detects Link-Local and Cloud Metadata addresses", () => {
            // 169.254.0.0/16
            expect(isPrivateOrReservedIp("169.254.169.254")).toBe(true); // AWS / GCP / Azure metadata
            expect(isPrivateOrReservedIp("169.254.1.1")).toBe(true);
            // Alibaba cloud metadata IP
            expect(isPrivateOrReservedIp("100.100.100.200")).toBe(true);
            // IPv6 link local
            expect(isPrivateOrReservedIp("fe80::1")).toBe(true);
            expect(isPrivateOrReservedIp("[fe80::abcd:1234]")).toBe(true);
            // Unique Local Addresses (fc00::/7)
            expect(isPrivateOrReservedIp("fc00::1")).toBe(true);
            expect(isPrivateOrReservedIp("fd12:3456:789a::1")).toBe(true);
        });
        it("allows genuine public routable IP addresses", () => {
            expect(isPrivateOrReservedIp("8.8.8.8")).toBe(false); // Google DNS
            expect(isPrivateOrReservedIp("1.1.1.1")).toBe(false); // Cloudflare DNS
            expect(isPrivateOrReservedIp("140.82.112.4")).toBe(false); // GitHub
            expect(isPrivateOrReservedIp("2606:4700:4700::1111")).toBe(false); // Cloudflare IPv6
        });
    });
    describe("validateSafeUrl", () => {
        it("rejects non-HTTP protocols", async () => {
            const fileRes = await validateSafeUrl("file:///etc/passwd");
            expect(fileRes.safe).toBe(false);
            expect(fileRes.reason).toContain("Only http: and https: are allowed");
            const ftpRes = await validateSafeUrl("ftp://ftp.example.com/file.txt");
            expect(ftpRes.safe).toBe(false);
            const gopherRes = await validateSafeUrl("gopher://127.0.0.1:70/");
            expect(gopherRes.safe).toBe(false);
            const dataRes = await validateSafeUrl("data:text/html,<script>alert(1)</script>");
            expect(dataRes.safe).toBe(false);
            const jsRes = await validateSafeUrl("javascript:alert(1)");
            expect(jsRes.safe).toBe(false);
        });
        it("rejects localhost and reserved hostnames", async () => {
            const res1 = await validateSafeUrl("http://localhost:3000/api");
            expect(res1.safe).toBe(false);
            const res2 = await validateSafeUrl("http://app.local/secret");
            expect(res2.safe).toBe(false);
            const res3 = await validateSafeUrl("http://server.internal/metrics");
            expect(res3.safe).toBe(false);
            const res4 = await validateSafeUrl("http://metadata.google.internal/computeMetadata/v1/");
            expect(res4.safe).toBe(false);
            expect(res4.reason).toContain("strictly forbidden");
            const res5 = await validateSafeUrl("http://instance-data/latest/meta-data/");
            expect(res5.safe).toBe(false);
        });
        it("rejects direct loopback and private IP URLs", async () => {
            const loopback1 = await validateSafeUrl("http://127.0.0.1:8080/admin");
            expect(loopback1.safe).toBe(false);
            const loopback2 = await validateSafeUrl("http://[::1]:3000/");
            expect(loopback2.safe).toBe(false);
            const private1 = await validateSafeUrl("http://192.168.1.1/router");
            expect(private1.safe).toBe(false);
            const private2 = await validateSafeUrl("http://10.0.0.5:9200/_cat/indices");
            expect(private2.safe).toBe(false);
            const metaRes = await validateSafeUrl("http://169.254.169.254/latest/meta-data/");
            expect(metaRes.safe).toBe(false);
        });
        it("accepts valid, safe public URLs", async () => {
            const res1 = await validateSafeUrl("https://fulbrightprogram.org/apply");
            expect(res1.safe).toBe(true);
            expect(res1.parsedUrl?.hostname).toBe("fulbrightprogram.org");
            const res2 = await validateSafeUrl("https://scholarships.gov.in/main.do");
            expect(res2.safe).toBe(true);
            expect(res2.parsedUrl?.hostname).toBe("scholarships.gov.in");
        });
        it("gracefully catches and rejects malformed URLs", async () => {
            const res1 = await validateSafeUrl("not-a-valid-url");
            expect(res1.safe).toBe(false);
            expect(res1.reason).toContain("Malformed URL");
            const res2 = await validateSafeUrl("http://");
            expect(res2.safe).toBe(false);
        });
    });
});
