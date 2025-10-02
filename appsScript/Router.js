// handler must return a string status
function route(name, handler) {
  return {
    name:name,
    handler:e => {
      const res = handler(e)
      return res==""?"OK no route return":res
    }
  }
}

// figure out if we need a get router
//use the static route construction function
function newPostRouter(...routes) {
  //private, pls dont access
  // map of routeName to function(data:any):ContentServiceTextOutput
  routeMap = new Map();

  routes.forEach(route => {
    routeMap.set(route.name, route.handler)
  })

  const cs = m => ContentService.createTextOutput(m)

  return {
    listen: e => {
      let body
      try {body = JSON.parse(e.postData.contents)} 
      catch (err) {return cs("ERROR cant parse json" + err)}

      const route = body.route
      const data = body.data

      if (!route) {
        return cs("ERROR route not provided")
      } else if (!data) {
        return cs("ERROR data not provided")
      } else if (!routeMap.has(route)) {
        return cs("ERROR route not defined")
      }

      return cs(JSON.stringify(routeMap.get(route)(data)))
    }
  }
}




