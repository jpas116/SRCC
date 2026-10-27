/* Tiny standalone renderer for the SRCC mockup pages.
   Expands {{holes}}, <sc-for>, <sc-if> and onClick handlers so the
   design files work as plain web pages outside the design canvas. */
(function () {
  'use strict';

  // Hide the raw template until it's rendered.
  var hide = document.createElement('style');
  hide.textContent = 'x-dc{display:none}';
  document.head.appendChild(hide);

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (partial) {
    for (var k in partial) this.state[k] = partial[k];
    if (this.__rerender) this.__rerender();
  };
  DCLogic.prototype.forceUpdate = function () { if (this.__rerender) this.__rerender(); };

  // Helpers shared by the pages.
  window.SRCC = {
    loadJSON: function (url, cb) {
      fetch(url, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d) cb(d); }).catch(function () {});
    },
    fmtDate: function (iso) {
      var d = new Date(iso);
      return { mon: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(), day: String(d.getDate()).padStart(2, '0'), dow: d.toLocaleString('en-US', { weekday: 'short' }).toUpperCase(), long: d.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) };
    },
    fmtTime: function (iso) {
      var d = new Date(iso); var h = d.getHours(), m = d.getMinutes();
      var ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12;
      return h + (m ? ':' + String(m).padStart(2, '0') : '') + ap;
    },
    when: function (ev) {
      if (ev.allDay) return 'All day';
      var s = window.SRCC.fmtTime(ev.start);
      return ev.end ? s + '\u2013' + window.SRCC.fmtTime(ev.end) : s;
    },
    mailto: function (to, subject, lines) {
      var body = lines.filter(function (l) { return l; }).join('\n');
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    },
    share: function (title) {
      var url = window.location.href;
      if (navigator.share) { navigator.share({ title: title, url: url }).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { alert('Link copied'); });
    }
  };

  var HOLE = /\{\{\s*([\w$.]+)\s*\}\}/g;
  var WHOLE = /^\s*\{\{\s*([\w$.]+)\s*\}\}\s*$/;

  function lookup(path, scope) {
    if (path === 'true') return true;
    if (path === 'false') return false;
    var parts = path.split('.');
    var cur;
    for (var i = scope.length - 1; i >= 0; i--) {
      if (Object.prototype.hasOwnProperty.call(scope[i], parts[0])) { cur = scope[i]; break; }
    }
    if (cur === undefined) return '';
    for (var p = 0; p < parts.length; p++) {
      if (cur == null) return '';
      cur = cur[parts[p]];
    }
    return cur === undefined || cur === null ? '' : cur;
  }

  function interpolate(str, scope) {
    return str.replace(HOLE, function (_, path) { var v = lookup(path, scope); return v === true ? 'true' : v === false ? 'false' : String(v); });
  }

  function renderNodes(nodes, scope, out) {
    for (var i = 0; i < nodes.length; i++) renderNode(nodes[i], scope, out);
  }

  function renderNode(node, scope, out) {
    if (node.nodeType === 3) {
      out.push(document.createTextNode(node.nodeValue.indexOf('{{') >= 0 ? interpolate(node.nodeValue, scope) : node.nodeValue));
      return;
    }
    if (node.nodeType !== 1) return;
    var tag = node.tagName.toLowerCase();

    if (tag === 'sc-for') {
      var m = WHOLE.exec(node.getAttribute('list') || '');
      var list = m ? lookup(m[1], scope) : [];
      var as = node.getAttribute('as') || 'item';
      if (!Array.isArray(list)) list = [];
      for (var i = 0; i < list.length; i++) {
        var local = {}; local[as] = list[i]; local.$index = i;
        renderNodes(node.childNodes, scope.concat([local]), out);
      }
      return;
    }
    if (tag === 'sc-if') {
      var mi = WHOLE.exec(node.getAttribute('value') || '');
      var cond = mi ? lookup(mi[1], scope) : false;
      if (cond) renderNodes(node.childNodes, scope, out);
      return;
    }

    var el = node.cloneNode(false);
    var attrs = Array.prototype.slice.call(el.attributes);
    for (var a = 0; a < attrs.length; a++) {
      var name = attrs[a].name, val = attrs[a].value;
      if (name.indexOf('hint-') === 0) { el.removeAttribute(name); continue; }
      if (val.indexOf('{{') < 0) continue;
      var whole = WHOLE.exec(val);
      if (name.indexOf('on') === 0) {
        el.removeAttribute(name);
        if (whole) {
          var fn = lookup(whole[1], scope);
          if (typeof fn === 'function') el.addEventListener(name.slice(2), fn);
        }
        continue;
      }
      el.setAttribute(name, interpolate(val, scope));
    }
    var kids = [];
    renderNodes(node.childNodes, scope, kids);
    for (var k = 0; k < kids.length; k++) el.appendChild(kids[k]);
    out.push(el);
  }

  function boot() {
    var root = document.querySelector('x-dc');
    var script = document.querySelector('script[data-dc-script]');
    if (!root || !script) return;

    var propsDecl = {};
    try { propsDecl = JSON.parse(script.getAttribute('data-props') || '{}'); } catch (e) {}
    var props = {};
    for (var key in propsDecl) if (key[0] !== '$' && propsDecl[key] && 'default' in propsDecl[key]) props[key] = propsDecl[key].default;

    var Component;
    try {
      Component = new Function('DCLogic', script.textContent + '\n;return Component;')(DCLogic);
    } catch (e) { console.error('SRCC mockup: could not load page logic', e); return; }

    var comp = new Component(props);
    comp.props = props;
    var template = Array.prototype.slice.call(root.childNodes);
    var mount = document.createElement('div');
    root.parentNode.insertBefore(mount, root);
    root.parentNode.removeChild(root);

    function render() {
      var active = document.activeElement, focusId = active && active.id, pos = null;
      try { pos = active && typeof active.selectionStart === 'number' ? active.selectionStart : null; } catch (e) {}
      var vals = comp.renderVals ? comp.renderVals() : {};
      var out = [];
      renderNodes(template, [vals], out);
      while (mount.firstChild) mount.removeChild(mount.firstChild);
      for (var i = 0; i < out.length; i++) mount.appendChild(out[i]);
      if (focusId) {
        var again = document.getElementById(focusId);
        if (again) { again.focus(); if (pos !== null) { try { again.setSelectionRange(pos, pos); } catch (e) {} } }
      }
    }
    comp.__rerender = render;
    render();
    if (typeof comp.componentDidMount === 'function') {
      try { comp.componentDidMount(); } catch (e) { console.error('SRCC mockup: componentDidMount failed', e); }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
