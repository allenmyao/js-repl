// Build a worker from an anonymous function body
let blobURL = URL.createObjectURL( new Blob([ '(',
function () {
  // BEGIN WORKER CODE

  let proxyFunction = function (callback) {
    return new Proxy({}, {
      get: function (target, prop) {
        new Proxy({}, {
          apply: function (target, thisArg, argumentList) {
            callback(prop, argumentList);
          }
        });
      }
    });
  };

  let proxyCall = function (callback) {
    return new Proxy({}, { apply: function (target, thisArg, argumentList) {
      callback(argumentList);
    });
  };


  let alertCallback = function (argumentList) {
    self.postMessage({
      alert: {
        args: argumentsList[0]
      }
    }
  };

  let scope = {
    alert: proxyCall(alertCallback),
    window: {
      alert: proxyCall(alertCallback)
    },
    console: proxyFunction(function (name, argumentList) {
      self.postMessage({
        console: {
          method: name,
          args: argumentList
        }
      });
    })
  }

  self.onmessage = function (e) {
    let script = e.data['script'];
    // use main thread onerror listener?
    try {
      (function (s) {
        let returnValue;
        with (s) {
          returnValue = eval(script);
        }
        self.postMessage({
          success: returnValue
        });
      })(scope);
    } catch (e) {
      self.postMessage({ error: e });
    }
  }

  // END WORKER CODE
}.toString(),
')()' ], { type: 'application/javascript' } ) );

let worker = new Worker( blobURL );
URL.revokeObjectURL( blobURL );


function runScript(script) {
  worker.postMessage({ script: script });
}

// receive message from worker
worker.onmessage = function (e) {
    let data = e.data;
    let error = data.error;
    if (error) {
        // output error
    } else {
        // return output
    }
}

function stopScript() {
  worker.terminate();
}

worker.onerror = function () {

}
