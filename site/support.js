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
      if (name === 'onclick') {
        el.removeAttribute(name);
        if (whole) {
          var fn = lookup(whole[1], scope);
          if (typeof fn === 'function') el.addEventListener('click', fn);
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

    function render() {
      var vals = comp.renderVals ? comp.renderVals() : {};
      var out = [];
      renderNodes(template, [vals], out);
      while (mount.firstChild) mount.removeChild(mount.firstChild);
      for (var i = 0; i < out.length; i++) mount.appendChild(out[i]);
    }
    comp.__rerender = render;
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
