// The one address that never changes.
// Brandon, 2026-10-13: "I need a live link that's always getting updated."
// The app runs on a laptop, and the private address that reaches it changes whenever the laptop restarts the
// connection. This page has a fixed address. It reads where the app is right now (link.json, kept current by
// ops/link_publish.sh on the laptop), checks that the app answers there, and goes. Nothing about a customer, a job
// or a login is on this page; whoever arrives still has to sign in to the app.
(function () {
  var me = document.currentScript;
  var which = me.getAttribute("data-which") || "real";      // real | practice
  var path = me.getAttribute("data-path") || "/field";      // where in the app to land
  var here = me.src.replace(/go\.js.*$/, "");               // this site's own folder
  var API = "https://api.github.com/repos/bcbachman1-cmyk/jpc-go/contents/link.json";
  var msg = document.getElementById("m"), lastApi = 0, tries = 0;

  function say(html) { msg.innerHTML = html; }
  function json(url, headers) { return fetch(url, { cache: "no-store", headers: headers || {} }).then(function (r) { if (!r.ok) throw new Error("no"); return r.json(); }); }
  function alive(u) {   // true only when the app itself answers at u
    return new Promise(function (done) {
      var t = setTimeout(function () { done(false); }, 8000);
      fetch(u + "/api/health", { cache: "no-store" }).then(function (r) { clearTimeout(t); done(r.ok); }, function () { clearTimeout(t); done(false); });
    });
  }
  function clean(u) { return String(u || "").replace(/\/+$/, ""); }
  function go(u) { location.replace(u + path + (location.hash || "")); }

  function attempt() {
    tries += 1;
    json(here + "link.json?t=" + Date.now()).then(function (d) { return clean(d[which]); }, function () { return ""; }).then(function (first) {
      return (first ? alive(first) : Promise.resolve(false)).then(function (ok) {
        if (ok) return go(first);
        // The address on this site may be a minute behind the laptop. Ask the newest copy directly (at most once a minute).
        if (Date.now() - lastApi < 60000) return wait();
        lastApi = Date.now();
        return json(API, { Accept: "application/vnd.github.raw+json" }).then(function (d) { return clean(d[which]); }, function () { return ""; }).then(function (second) {
          if (!second || second === first) return wait();
          return alive(second).then(function (ok2) { return ok2 ? go(second) : wait(); });
        });
      });
    });
  }
  function wait() {
    say("The app is not answering right now.<br>The laptop it runs on may be asleep or restarting its connection.<br><br>This page keeps trying by itself." + (tries > 2 ? "<br><br><a href=''>Try again now</a>" : ""));
    setTimeout(attempt, 10000);
  }
  attempt();
})();
