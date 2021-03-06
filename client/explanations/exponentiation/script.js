'use strict'

// color bewer, ftw!
var colors = [ "#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c"
  , "#fc4e2a", "#e31a1c", "#bd0026", "#800026" ].reverse()
function color(d) { return colors[d] }

var colorScale = d3.scale.linear()
  .domain(d3.range(colors.length)
    .map(function(d) { return d / (colors.length - 1) }))
  .range(colors);

var myApp = angular.module('myApp', [])
myApp.controller('MainCtrl', function($scope, $window, $sce) {
  angular.element($window).bind('scroll', function() {
    $scope.$apply(function() { $scope.yOffset = window.pageYOffset })
  })
  $scope.$watch(function() {
    return $window.innerHeight
  }, function() {
    $scope.windowHeight = $window.innerHeight;
  })
  angular.element($window).on('resize', function() {
    $scope.$apply(function() {})
  })
  function cap(min, max, val) {
    if(val < min) return min;
    if(val > max) return max;
    return val;
  }
  $scope.visible = function(ym1) {
    return 1
    var yOffset = window.pageYOffset
    var ym2 = yOffset + window.innerHeight / 2
    var buf = 200
    var fade = 100
    if (ym1 - ym2 > buf) return cap(0, 1, (fade - (ym1 - ym2 - buf)) / fade)
    if(ym2 - ym1 > buf) return cap(0, 1, (fade - (ym2 - ym1 - buf)) / fade)

    return 1
  }
})

myApp.controller('SimpleGrowthCtrl', function($scope) {
  $scope.opts = { steps: 4, rate: 2, speed: 5 }
})

myApp.controller('LinearGrowthDemoCtrl', function($scope) {
  $scope.opts = { rate: 1, speed: 10, steps: 10 }
})

myApp.controller('ExponentialGrowthDemoCtrl', function($scope) {
  $scope.opts = { rate: 2, speed: 10, steps: 4 }
})


myApp.controller('ViralDemoCtrl', function($scope) {
  $scope.opts = { speed: 8, size: 20 }
})

myApp.directive('playButton', function() {
  function link(scope, el, attr) {
    var svg = d3.select(el[0]).select('svg')
      .style('cursor', 'pointer')
      .style('background-color', 'rgba(255, 255, 255, 0.5)')
    var g = svg.append('g')
    var s = 20
    var circle = g.append('circle')
      .attr('r', 40)
      .attr('fill', 'rgba(255, 255, 255, 0.4)')
    var icon = g.append('path')
      .attr('transform', 'translate(' + [ s/4, 0 ] + ')')
      .attr('d', 'M-' + s + ',-' + s + 'L' + s + ',0L-' + s + ',' + s + 'Z')
      .attr('fill', 'rgba(0, 0, 0, 0.2)')
    scope.$watch('width * height', function() {
      var w = scope.width, h = scope.height
      svg.attr({width: w, height: h})
      g.attr('transform', 'translate(' + [w / 2, h / 2] + ')')
      scope.myStyle = {
          position: 'absolute'
        , top: '0'
        , left: '0'
        , display: 'block'
        , width: w + 'px'
        , height: h + 'px'
      }
    })
    scope.$watch('isPlaying', function(playing) {
      svg.transition().style('opacity', playing ? 0 : 1)
        .style('pointer-events', playing ? 'none' : 'all')
    })
    svg.on('click', function() {
      scope.$apply(function() { scope.$emit('play') })
    })
  }
  return {
      link: link
    , restrict: 'E'
    , template: '<div ng-style="myStyle">'
      + '<svg></svg>'
    + '</div>'
  }
})

myApp.directive('simpleGrowth', function() {
  function link(scope, el, attr) {
    var root = d3.select(el[0])
    var svg = root.append('svg')
    var w = root.node().clientWidth
    var h = root.node().clientHeight
    svg.attr({ width: w, height: h })
    scope.width = w
    scope.height = h
    var opts = scope.opts
    var data0 = function() { return { x: 0, y: 0, i: 0 } }
    var data = [ data0() ]
    var curStep = 0
    var g = svg.append('g')
    var durScale = d3.scale.linear().domain([1, 10]).range([5000, 200])
    function update() {
      var duration = durScale(opts.speed)
      var bw = w * Math.pow(1 / opts.rate, opts.steps)
      var bh = h / 4
      var len = data.length
      data = d3.range(data.length * opts.rate || 1).map(function(d) {
        return { x: bw * (len !== 0 ? d % len : 0), y: 0, i: d }
      })

      var block = g.selectAll('.block').data(data).enter()
        .append('g')
        .classed('block', true)
        .style('fill', color(curStep))

      block.append('rect').attr({ width: bw, height: bh })

      var fsize = Math.min(64, bw / 2)
      block.append('text')
        .attr('x', bw / 2)
        .attr('y', bh + fsize)
        .style('text-anchor', 'middle')
        .style('dominant-baseline', 'middle')
        .style('font-size', fsize + 'px')
        .style('fill', '#555')
        .text(function(d) { return d.i + 1 })

      block
        .attr('transform', function(d) {
          return 'translate(' + [d.x, d.y] + ')'
        })
        .filter(function(d, i) { return d.i > 0 })
        .style('opacity', 0)
        .transition().duration(duration / 4)
        .style('opacity', 1)
        .attr('transform', function(d) {
          d.y = bh * Math.floor(d.i / len)
          return 'translate(' + [d.x, d.y] + ')'
        })
        .transition().duration(duration / 4)
        .attr('transform', function(d) {
          d.x = bw * d.i
          return 'translate(' + [d.x, d.y] + ')'
        })
        .transition().duration(duration / 4)
        .attr('transform', function(d) {
          d.y = 0
          return 'translate(' + [d.x, d.y] + ')'
        }).call(function(blocks) {
          var s = blocks.size()
          blocks.each('end', function(d) {
            if (!--s && curStep < opts.steps) update()
          })
        })
      curStep++
    }
    var intr
    function restart() {
      var blocks = g.selectAll('.block')
      blocks.transition()
      blocks.remove()
      data = [ data0() ]
      curStep = 0
      update()
    }
    scope.$on('restart', restart);
    scope.$watch('opts', function() {
      var r = +opts.rate
      if (r === 4 && opts.steps > 4) return opts.steps = 4
      else if (r === 3 && opts.steps > 5) return opts.steps = 5
      var labels = ['doubling', 'tripling', 'quadrupling']
      opts.rateLabel = labels[opts.rate - 2]
      opts.otherRateLabels = labels.slice(0)
      opts.otherRateLabels.splice(labels.indexOf(opts.rateLabel), 1)
      restart()
    }, true)
    restart()
  }
  return { link: link, restrict: 'E' }
})

myApp.directive('cellGrowth', function($timeout) {
  function link(scope, el, attr) {
    var root = d3.select(el[0])
    var svg = root.select('svg')
    var w, h, nodes
    w = root.node().clientWidth
    h = root.node().clientHeight
    svg.attr({width: w, height: h})
    scope.width = w
    scope.height = h

    var data = [ { x: w / 2, y: h / 2 } ]

    function update() {
      nodes = svg.selectAll('circle').data(data)
      nodes.enter().append('circle')
        .attr('r', 5)
        .attr('fill', 'rgba(255, 155, 100, 1)')
        .attr('stroke', 'rgba(100, 100, 100, 1)')
        .attr('stroke-width', 2)
    }

    update()

    var force = d3.layout.force()
      .nodes(data)
      .charge(-40)
      .gravity(0)
      .friction(0.9)
      .size([w, h])
      .start()

    var start = Date.now()
    var color = d3.interpolateHsl(
        d3.hsl(50, 0.5, 0.5).toString()
      , d3.hsl(0, 0.5, 0.5).toString())
    var duration = 1000
    var boundCharge = -10
    var padding = 50
    force.on('tick', function() {
      var now = +Date.now()
      data.forEach(function(d, i) {
        if (d.x < 0 + padding) {
          d.px += boundCharge * ( padding - d.x ) / padding
        } else if (d.x > w - padding) {
          d.px += -boundCharge * - Math.log( (d.x - (w - padding) ) / padding,
          2) / 1
        }
        if (d.y < 0 + padding) {
          d.py += boundCharge * ( padding - d.y ) / padding
        } else if (d.y > h - padding) {
          d.py += -boundCharge * - Math.log( (d.y - (h - padding) ) / padding, 2)
        }
      })
      nodes
        .attr('cx', function(d) { return d.x })
        .attr('cy', function(d) { return d.y })
        .style('fill', function(d) {
          var t = Math.min((now - d.t) / duration, 1)
          return color(t)
        })
    })

    var interval = setInterval(function() {
      if (data.length > 64) {
        clearInterval(interval)
        return
      }
      data = data.concat(data.map(function(d) {
        return { x: d.x + Math.random(), y: d.y + Math.random(), t: Date.now() }
      }))
      window.data = data
      update()
      force
        .nodes(data)
        .start()
    }, duration)
  }
  return {
      link: link
    , restrict: 'E'
    , transclude: true
    , template: '<div style="position: relative">'
      + '<svg></svg>'
      + '<div style="position: absolute; top: 0; left: 0;" ng-transclude></div>'
    + '</div>'
  }
})

myApp.directive('growthDemo', function() {
  function link(scope, el, attr) {
    var root = d3.select(el[0])
    var svg = root.select('svg')
    var m = { l: 30, r: 30, t: 30, b: 30 }
    var w = root.node().clientWidth - m.l - m.r
    var h = root.node().clientHeight - m.t - m.b
    var bw = 10, bh = 10
    var ghostG = svg.append('g')
    var horG = svg.append('g')
    var blocks = []
    var labels = 0
    var duration = 5000
    var stepDuration
    var stepCount = 0
    var isLooping = false
    var dropTimer
    var horX = 0
    var opts = scope.opts
    var duration
    var stepW
    var stepDur
    var data
    var bh
    var isLinear = attr.growthType === 'linear'

    svg.attr({width: w + m.l + m.r, height: h + m.t + m.b})

    scope.$on('reset', reset)
    scope.$watch('opts', reset, true)

    var durScale = d3.scale.linear().domain([1, 10]).range([10000, 5000])

    function reset() {
      bh = h / (opts.steps * opts.rate)
      stepW = (w - bw - 1) / opts.steps
      stepDur = duration / opts.steps
      bh = (isLinear)
        ? h / (opts.steps * opts.rate)
        : h * Math.pow(1 / opts.rate, opts.steps - 1)
      var bhe = h * Math.pow(1 / opts.rate, opts.steps)
      data = d3.range(opts.steps).map(function(i) {
        if (isLinear)
          return {
            x: stepW * (i + 1),
            y: h * (i + 1) / opts.steps,
            dy: bh * opts.rate
          }
        else // Exponential
          return {
            x: stepW * (i + 1),
            y: bhe * Math.pow(opts.rate, i + 1),
            dy: bhe * Math.pow(opts.rate, (i + 1)) / opts.rate * (opts.rate - 1)
          }
      })
      ghostG.selectAll('*').remove()
      var trails = ghostG.selectAll('g').data(data).enter().append('g')
        .attr('transform', function(d) {
          return 'translate(' + [d.x + 3 + m.l, h + m.t] + ')'
        })
      trails.append('line')
        .attr({ y1: function(d) { return -d.y }, y2: 0 })
        .style({'stroke-width': 2, stroke: 'rgba(0, 0, 0, 0.2)'})
      trails.append('line')
        .attr('y1', function(d) { return -d.y })
        .attr('y2', function(d) { return -d.y + d.dy })
        .style({'stroke-width': 2, stroke: '#3498db'})
      trails.append('text')
        .attr('x', 5)
        .attr('y', function(d) { return -d.y + d.dy / 2 + 3 })
        .style('font-size', 12 + 'px')
        .style('fill', '#555')
        .text((isLinear ? '+' : 'x') + opts.rate)
      trails
        .style('opacity', 0)
        .transition()
        .delay(function(d, i) { return stepDur * (i + 1) })
        .style('opacity', 1)

      horG.transition()
      d3.timer.flush()
      horG.attr('transform', 'translate(' + [0, (m.t + h) ] + ')')
      var sel = horG
      duration = durScale(+opts.speed)
      d3.range(+opts.steps).forEach(function(d) {
        sel = sel.transition()
          .duration( duration / opts.steps)
          .ease('linear')
          .attr('transform', 'translate(' + [ stepW * (d + 1) + m.l, m.t + h ] + ')')
          .each('end', function() {
            if (d < +opts.steps - 1) update(d)
            else sel.transition()
              .ease('linear')
              .attr('transform', 'translate(' + [ w + stepW * 2, m.t + h ] + ')')
          })
      })
      blocks = []
      horG.selectAll('rect').remove()
      if (!isLinear && bh > 1) horG.append('rect')
        .attr({width: bw, height: bh})
        .attr('y', - bh - 1)
        .attr('class', 'block')
      labels = 0
      first = true
      update(0)
    }

    var first = false
    function update(i) {
      if (isLinear)
        blocks = blocks.concat(d3.range(+opts.rate)
          .map(function(){ return {} }))
      else if (bh > 1) {
        if(blocks.length)
          blocks = blocks.concat(d3.range(blocks.length * (opts.rate - 1))
            .map(function() { return {} }))
        else blocks = [{}]
      }
      var dropDuration = 0.7
      if (bh > 1) horG.selectAll('rect').data(blocks)
        .enter().append('rect')
        .attr('class', 'block')
        .attr({width: bw, height: bh})
        .attr('x', stepW / 2)
        .attr('y', function(d, i) { return - h - bh * (i + 5) })
        .transition()
        .ease('linear')
        .delay(stepDur * (1 - dropDuration))
        .duration(stepDur * dropDuration)
        .attr('x', 0)
        .attr('y', function(d, i) { return - bh * (i + 1) - 1 })
      first = false
      labels++
    }
    reset()
  }
  return {
    link: link,
    restrict: 'E',
    transclude: true,
    template: '<div style="position: relative">'
      + '<svg></svg>'
      + '<div ng-transclude></div>'
    + '</div>'
  }
})

myApp.directive('virusDemo', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var w = el.node().clientWidth, h = el.node().clientHeight
    var r = 18
    var duration = 200
    var opts = scope.opts
    var m = { l: r, t: r, r: r, b: r}
    var maxGenerationGuess = 10
    var canvas = el.append('canvas')
      .style({position: 'absolute', top: 0, left: 0})
      .attr({width: w, height: h})
    var ctx = canvas.node().getContext('2d')
    var svg = el.append('svg')
      .style({position: 'absolute', top: 0, left: 0})
      .attr({width: w, height: h})
    var plot = svg.append('g').classed('plot', true)
    var n = 100
    var sampler = poissonDiscSampler(h - m.t - m.b, h - m.t - m.b, r)
    var samples = []
    var sample
    var maxRadius = (h - m.t - m.b) / 2
    var sizeScale = d3.scale.linear().domain([0, 20]).range([40, maxRadius])
    var cross = function(v, w) { return v[0] * w[1] - v[1] * w[0] }
    var minus = function(v, w) { return [ v[0] - w[0], v[1] - w[1] ] }
    while(sample = sampler()) samples.push(sample)

    var xOffset = (w - m.l - m.r) * 0.75 - (h - m.t - m.b) / 2

    var nodes = samples
      .map(function(d, i) { return {
        x: d[0] + xOffset,
        y: d[1],
        id: i,
        friends: [],
        infection: 0,
        visible: true,
        generation: -1 // -1 means "no generation"
      }
    }).filter(isWithRadius.bind(this, maxRadius))

    function isWithRadius(r, d) {
      var x = d.x - xOffset - maxRadius
      var y = d.y - maxRadius
      return Math.sqrt(x * x + y * y) < r
    }
    var links = [] // Just for drawling the links.
    var graph = {} // Hash for graph.
    nodes.forEach(function(p1) {
      var neighbors = nodes.map(function(p2) {
        var a = p2.x - p1.x, b = p2.y - p1.y
        var c = Math.sqrt( a * a + b * b )
        return { c: c, node: p2 }
      }).filter(function(d) { return p1 !== d.node && d.c < r * 2 })
        .sort(function(a, b) { return a.c - b.c }) // Ascending.
      graph[p1.id] = {}
      var l = 0
      neighbors.forEach(function(n1) {
        var p2 = n1.node
        if (graph[p1.id][p2.id] || (graph[p2.id] && graph[p2.id][p1.id]) ) {
          return
        }

        // Proposed line.
        var p = [p1.x, p1.y], r = minus([p2.x, p2.y], p)

        // Based off of: https://github.com/pgkelley4/line-segments-intersect/blob/master/js/line-segments-intersect.js
        for(var i = 0; i < neighbors.length; i++) {
          var neighbor = neighbors[i].node
          for(var j = 0; j < neighbor.friends.length; j++) {
            var friend = neighbor.friends[j]
            var q = [neighbor.x, neighbor.y]
            var q2 = friend
            var s = minus([friend.x, friend.y], q)
            var uNum = cross(minus(q, p), r)
            var denom = cross(r, s)
            if (uNum < 1e-6 && uNum > -1e-6 && denom < 1e-6 && denom > -1e-6) {
              // collinear. check if they overlap.
              if (
                (
                  (q[0] - p[0] < 0) !== (q[0] - p2.x < 0)
                    !== (q2.x - p[0] < 0) !== (q2.x - p2.x < 0)
                ) || (
                  (q[1] - p[1] < 0) !== (q[1] - p2.y < 0)
                    !== (q2.y - p[1] < 0) !== (q2.y - p2.y < 0)
                )
              ) return false // they intersect.
            }
            if (denom < 1e-6 && denom > -1e-6) continue // parallel lines.
            var u = uNum / denom
            var t = cross(minus(q, p), s) / denom
            // Found intersection.
            if ( 0 < t && t < 1 && u > 0 && u < 1) return false // they intersect.
          }
        }
        graph[p1.id][p2.id] = true
        graph[p2.id] = graph[p2.id] || {}
        graph[p2.id][p1.id] = true
        p1.friends.push(p2)
        p2.friends.push(p1)
        links.push({ source: p1, target: p2 })
        l++
      })
    })


    var plotHeight = 200
    var plotWidth = 300

    plot.attr('transform', 'translate(' + [100, h / 2 - plotHeight / 2 ] + ')')
    plot.append('rect')
      .attr({width: plotWidth, height: plotHeight})  
      .style('fill', 'none')
    var x = d3.scale.linear()
      .domain([0, maxGenerationGuess])
      .range([10, plotWidth])
    var y = d3.scale.linear()
      .domain([0, nodes.length])
      .range([plotHeight, 0])
    var axis = d3.svg.axis().scale(y).ticks(2).orient('left')
      .innerTickSize(-plotWidth).outerTickSize(0)
    plot.append('g').classed('axis', true).call(axis)
    var valuesG = plot.append('g').classed('values', true)
    var labelsG = plot.append('g').classed('labels', true)
    plot.append('text').text('people infected over time')
      .attr('y', -10)
      .attr('x', plotWidth / 2)
      .style('text-anchor', 'middle')
      .style('fill', 'rgba(0, 0, 0, 0.6)')
    var history = []

    function updateHistory() {
      var xa = function(d) { return x(d.i) }
      var sel = valuesG.selectAll('line').data(history)
      sel.exit().remove()
      sel.enter()
        .append('line')
        .style('stroke', function(d) { return colorScale(d.i / maxGenerationGuess * 0.7) })
        .attr({y1: y(0), y2: y(0), x1: xa, x2: xa})
        .transition()
        .attr({y1: y(0), y2: function(d) { return y(d.d) }, x1: xa, x2: xa})
      sel = labelsG.selectAll('text').data(history)
      sel.exit().remove()
      sel.enter()
        .append('text')
        .attr({x: xa, y: y(0) + 15 })
        .style('text-anchor', 'middle')
        .style('font-size', 12 + 'px')
        .text(function(d) { return d.i; })
    }
  
    function drawLinks() {
      ctx.lineWidth = 2
      links.forEach(function(link) {
        var p1, p2
        if (link.source.infection > link.target.infection)
          p1 = link.source, p2 = link.target
        else p1 = link.target, p2 = link.source

        if (!p1.visible || !p2.visible) return

        var v = [p1.x + m.l, p1.y + m.t]
        var r = [p2.x - p1.x, p2.y - p1.y]
        var i = p1.infection
        if (p1.infection >= 1 && p2.infection >= 1) {
          ctx.beginPath()
          ctx.moveTo(p1.x + m.l, p1.y + m.t)
          ctx.strokeStyle = color1
          ctx.lineTo(p2.x + m.l, p2.y + m.t)
          ctx.stroke()
        } else {
          var b = [v[0] + r[0] * i, v[1] + r[1] * i]
          ctx.beginPath()
          ctx.moveTo(v[0], v[1])
          ctx.strokeStyle = color1
          ctx.lineTo(b[0], b[1])
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(b[0], b[1])
          ctx.strokeStyle = color2
          ctx.lineTo(p2.x + m.l, p2.y + m.t)
          ctx.stroke()
        }
      })
    }
    drawLinks()

    var color1 = 'rgb(227, 26, 28)' // red
    var color2 = 'rgba(0, 0, 0, 0.1)' // blue
    ctx.font = '6px'
    ctx.textAlign = 'center'
    function drawNodes() {
      ctx.lineWidth = 0
      nodes.forEach(function(d) {
        if (!d.visible) return
        ctx.beginPath()
        ctx.fillStyle = d.generation === -1
          ? color2 : colorScale(d.generation / maxGenerationGuess * 0.7)
        ctx.arc(d.x + m.l, d.y + m.t, d.generation === -1 ? r / 3 : r / 2.5, 0, 2 * Math.PI)
        ctx.fill()
        if (d.generation !== -1) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
          ctx.fillText(d.generation, d.x + m.l, d.y + m.t + 4)
        }
      })
    }
    ctx.clearRect(0, 0, w, h)
    drawLinks()
    drawNodes(0)

    // the svg acts only as invisible a click region.
    svg.append('g').attr('class', 'nodes')
      .selectAll('circle').data(nodes)
      .enter().append('circle')
      .attr({
        r: r / 3,
        cx: function(d) { return d.x + m.l },
        cy: function(d) { return d.y + m.t }
      })
      .style('fill','rgba(0, 0, 0, 0)')

    var  frontier = []
    var visited = {}
    var intr
    var patientZero = null
    function infect(d) {
      patientZero = d
      visited = {}
      history = [{d: 1, i: 0}] // Patient zero!
      nodes.forEach(function(d) { d.infection = 0, d.generation = -1 })
      visited[d.id] = true
      frontier = [d]
      d.infection = 1e-6
      d.generation = 0
      drawNodes()
      var i = 0
      var durScale = d3.scale.linear().domain([1, 10]).range([3000, 100])
      duration = durScale(opts.speed)
      clearInterval(intr)
      var prevNumInfected = 0
      intr = setInterval(function() {
        var newFrontier = []
        var hash = {} // hash to avoid duplicates.
        var numInfected = 0
        var i = history.length
        frontier.forEach(function(d) { visited[d.id] = true })
        frontier.forEach(function(d) {
          newFrontier = newFrontier.concat(d.friends.filter(function(d) {
            if (d.visible && !visited[d.id] && !hash[d.id]) {
              hash[d.id] = true
              d.infection = 1e-6
              d.generation = i
              numInfected++
              return true
            }else return false
          }))
        })
        frontier = newFrontier
        if(!numInfected || numInfected < prevNumInfected) {
          if (numInfected) updateHistory()
          step = function() { }
          return clearInterval(intr)
        }
        prevNumInfected = numInfected
        history.push({d: history[i - 1].d + numInfected, i: i })
        updateHistory()
      }, duration)
      var prevt = ppt
      step = function(t) {
        var dt = t - prevt
        prevt = t
        ctx.clearRect(0, 0, w, h)
        nodes.forEach(function(d) {
          if (d.infection > 0 && d.infection < 1) d.infection += dt / duration
          if (d.infection > 1) d.infection = 1
        })
        drawLinks()
        drawNodes()
      }
    }

    var step = function() { }
    var ppt = 0
    d3.timer(function(t) { ppt = t; step(t) })

    function restart() {
      var r = sizeScale(opts.size)
      nodes.forEach(function(d) {
        d.infection = 0
        d.generation = -1 // -1 means "no generation"
        d.visible = isWithRadius(r, d)
      })
      window.nodes = nodes
      function findPatientZero() {
        var cur = null, curR
        // find the center most node for patient zero.
        nodes.forEach(function(d) {
          var x = d.x - xOffset - ( w - m.t - m.b ) / 4, y = d.y - h / 2
          var r = Math.sqrt(x * x + y * y)
          if (!cur || curR > r) curR = r, cur = d
        })
        return cur
      }
      patientZero = patientZero || findPatientZero()
      infect(patientZero)
    }
    scope.$on('restart', restart)
    scope.$watch('opts', restart, true)

  }
  return { link: link, restrict: 'E' }
})


// From: http://bl.ocks.org/mbostock/19168c663618b7f07158
// Based on https://www.jasondavies.com/poisson-disc/
function poissonDiscSampler(width, height, radius) {
  var k = 30, // maximum number of samples before rejection
      radius2 = radius * radius,
      R = 3 * radius2,
      cellSize = radius * Math.SQRT1_2,
      gridWidth = Math.ceil(width / cellSize),
      gridHeight = Math.ceil(height / cellSize),
      grid = new Array(gridWidth * gridHeight),
      queue = [],
      queueSize = 0,
      sampleSize = 0;

  return function() {
    if (!sampleSize) return sample(Math.random() * width, Math.random() * height);

    // Pick a random existing sample and remove it from the queue.
    while (queueSize) {
      var i = Math.random() * queueSize | 0,
          s = queue[i];

      // Make a new candidate between [radius, 2 * radius] from the existing sample.
      for (var j = 0; j < k; ++j) {
        var a = 2 * Math.PI * Math.random(),
            r = Math.sqrt(Math.random() * R + radius2),
            x = s[0] + r * Math.cos(a),
            y = s[1] + r * Math.sin(a);

        // Reject candidates that are outside the allowed extent,
        // or closer than 2 * radius to any existing sample.
        if (0 <= x && x < width && 0 <= y && y < height && far(x, y)) return sample(x, y);
      }

      queue[i] = queue[--queueSize];
      queue.length = queueSize;
    }
  };

  function far(x, y) {
    var i = x / cellSize | 0,
      j = y / cellSize | 0,
      i0 = Math.max(i - 2, 0),
      j0 = Math.max(j - 2, 0),
      i1 = Math.min(i + 3, gridWidth),
      j1 = Math.min(j + 3, gridHeight);

    for (j = j0; j < j1; ++j) {
      var o = j * gridWidth;
      for (i = i0; i < i1; ++i) {
        if (s = grid[o + i]) {
          var s,
            dx = s[0] - x,
            dy = s[1] - y;
          if (dx * dx + dy * dy < radius2) return false;
        }
      }
    }

    return true;
  }

  function sample(x, y) {
    var s = [x, y];
    queue.push(s);
    grid[gridWidth * (y / cellSize | 0) + (x / cellSize | 0)] = s;
    ++sampleSize;
    ++queueSize;
    return s;
  }
}
