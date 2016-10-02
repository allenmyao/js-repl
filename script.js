// Build a worker from an anonymous function body
let blobURL = URL.createObjectURL( new Blob([ '(',
function () {
  // BEGIN WORKER CODE

  let proxyFunction = function (callback) {
    return new Proxy({}, {
      get: function (target, prop) {
        return new Proxy(function () {}, {
          apply: function (target, thisArg, argumentList) {
            callback(prop, argumentList);
          }
        });
      }
    });
  };

  let proxyCall = function (callback) {
    return new Proxy(function () {}, {
      apply: function (target, thisArg, argumentList) {
        callback(argumentList);
      }
    });
  };


  let alertCallback = function (argumentList) {
    self.postMessage({
      alert: {
        args: argumentList[0]
      }
    });
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
    let returnValue;
    try {
      (function (s) {
        with (s) {
          returnValue = eval(script);
        }
        self.postMessage({
          success: returnValue
        });
      })(scope);
    } catch (e) {
      if (e.name === 'DataCloneError') {
        self.postMessage({
          error: {
            message: 'Attempted to return a native function',
            name: e.name,
            stack: e.stack
          }
        });
      } else {
        self.postMessage({
          error: {
            message: e.message,
            name: e.name,
            stack: e.stack
          }
        });
      }
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

    let output = document.getElementById('output-list');
    let outputItem = document.createElement('li');
    let outputItemContent;

    let currentTime = new Date();
    let timestamp = `${currentTime.toLocaleDateString()} ${currentTime.toLocaleTimeString()}`;
    if (error) {
        // output error
        console.error(error);
        outputItemContent = document.createTextNode(`${timestamp}: Error occurred:\n${error.message}`);
    } else {
        // return output
        outputItemContent = document.createTextNode(`${timestamp}: ${JSON.stringify(data)}`);
    }
    outputItem.appendChild(outputItemContent);
    output.appendChild(outputItem);
}

function stopScript() {
  worker.terminate();
}

worker.onerror = function (e) {
  console.error(e);
}



let runButton = document.getElementById('run');
runButton.addEventListener('click', function (event) {
  let codeInput = document.getElementById('code');
  let code = codeInput.value;
  runScript(code);
});

let stopButton = document.getElementById('stop');
stopButton.addEventListener('click', function (event) {
  stopScript();
});
