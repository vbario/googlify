console.log("Hello")

require("!style-loader!css-loader!./style.css");
var $ = require('jquery');
var firebase = require('firebase');
var config = {
    apiKey: "AIzaSyAqpe7tAz1cXGD6_uLPL3rOcjZ1j26i604",
    authDomain: "mentionup-forum.firebaseapp.com",
    databaseURL: "https://mentionup-forum.firebaseio.com",
    projectId: "mentionup-forum",
    storageBucket: "mentionup-forum.appspot.com",
    messagingSenderId: "1052228231235"
  };
var FBApp = firebase.initializeApp(config);
var storageRef = FBApp.storage().ref();

import mergeImages from 'merge-images';

var startImage = "";
var finishedImage = "";
var userKey = "";

$('#signIn').click(function() {
	signIn();
})
$('#signUp').click(function() {
	signUp();
})
$('#upload').click(function() {
	upload();
})
$('#googlify').click(function() {
	googlify();
})
$('#save').click(function() {
	save();
})
$('#signOut').click(function() {
	signOut();
})

var signUp = function() {
	var email = document.getElementById("signUpEmail").value;
	var password = document.getElementById("signUpPassword").value;
	var passwordRepeat = document.getElementById("signUpPasswordRepeat").value;

	if (password !== passwordRepeat) return null;

	var signupData = FBApp.auth().createUserWithEmailAndPassword(email, password);
	signupData.then((data)=>{
		signIn(email, password)
	})
}

var signIn = function(emailOverride, passwordOverride) {
	var email = emailOverride ? emailOverride : document.getElementById("signInEmail").value;
	var password = passwordOverride ? passwordOverride : document.getElementById("signInPassword").value;

	var signinData = FBApp.auth().signInWithEmailAndPassword(email, password);
	signinData.then((data)=>{
		userKey = data.uid;
		signUserIn();
	})
}

function dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    //Old Code
    //write the ArrayBuffer to a blob, and you're done
    //var bb = new BlobBuilder();
    //bb.append(ab);
    //return bb.getBlob(mimeString);

    //New Code
    return new Blob([ab], {type: mimeString});


}

var save = function() {
	var file = dataURItoBlob(finishedImage);

	var num = Math.floor(Math.random() * 100000000000);
	storageRef.child('finishedUploads/' + userKey + "/" + num + ".png").put(file).then((snap)=>{
		FBApp.database().ref("finishedUploads/" + userKey).push(snap.metadata.downloadURLs[0], function() {
			window.location = "/";
		})
	})
}

var signOut = function() {
	FBApp.auth().signOut().then(()=>{
		userKey = "";
		window.location = "/";
	})
}

var upload = function() {
	var file = document.getElementById('uploadingFile').files[0];

	storageRef.child('uploads/' + userKey + '/' + file.name).put(file).then((snap)=>{
		startImage = snap.metadata.downloadURLs[0];
		googlify();
		// console.log("test")
	})
}

var googlify = function() {

	var addEyes = function(imageUrl, data) {
		var addEye = function(width, callback) {
			var url = "./images/eye.png";
			var eyeImage = new Image();
			eyeImage.src = url;

			var canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = width;
			canvas.getContext('2d').drawImage(eyeImage, 0, 0, width, width);

			callback(canvas.toDataURL());
		}

		var imageArray = [{src: imageUrl, x: 0, y: 0}]

		var totalEyePairs = data.length;
		var eyePairsAdded = 0;

		for (var eachFace in data) {
			var face = data[eachFace].faceLandmarks;
			var eyeWidth = (face.eyeLeftInner.x - face.eyeLeftOuter.x) * 2.5;

			addEye(eyeWidth, function(eyeUrl) {
				if (face.pupilLeft) {
					var leftEye = { src: eyeUrl, x: face.pupilLeft.x - eyeWidth/2, y: face.pupilLeft.y - eyeWidth/2}
					imageArray.push(leftEye);
				}
				if (face.pupilRight) {
					var rightEye = { src: eyeUrl, x: face.pupilRight.x - eyeWidth/2, y: face.pupilRight.y - eyeWidth/2}
					imageArray.push(rightEye);
				}
				eyePairsAdded += 1;

				if (eyePairsAdded == totalEyePairs) {
					mergeImages(imageArray).then(b64 => {
						document.querySelector('#finalImage').src = b64;
						finishedImage = b64;
					})
				}
			})
		}
	}

	// get eye positions
	// place eyes of proper widths on screen in right places

	// Replace the subscriptionKey string value with your valid subscription key.
        var subscriptionKey = "fe4c3c82b9ba421184181e5a40a2c157";

        // Replace or verify the region.
        //
        // You must use the same region in your REST API call as you used to obtain your subscription keys.
        // For example, if you obtained your subscription keys from the westus region, replace
        // "westcentralus" in the URI below with "westus".
        //
        // NOTE: Free trial subscription keys are generated in the westcentralus region, so if you are using
        // a free trial subscription key, you should not need to change this region.
        var uriBase = "https://westcentralus.api.cognitive.microsoft.com/face/v1.0/detect";

        // Request parameters.
        var params = {
            "returnFaceId": "true",
            "returnFaceLandmarks": "true",
            "returnFaceAttributes": "age,gender,headPose,smile,facialHair,glasses,emotion,hair,makeup,occlusion,accessories,blur,exposure,noise",
        };

        // Display the image.
        // var sourceImageUrl = document.getElementById("inputImage").value;
        var sourceImageUrl = startImage;
        document.querySelector("#sourceImage").src = sourceImageUrl;

        // Perform the REST API call.
        $.ajax({
            url: uriBase + "?" + $.param(params),

            // Request headers.
            beforeSend: function(xhrObj){
                xhrObj.setRequestHeader("Content-Type","application/json");
                xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
            },

            type: "POST",

            // Request body.
            data: '{"url": ' + '"' + sourceImageUrl + '"}',
        })

        .done(function(data) {
            // Show formatted JSON on webpage.
            // $("#responseTextArea").val(JSON.stringify(data, null, 2));
            console.log("DATA", data);
            addEyes(sourceImageUrl, data);
        })

        .fail(function(jqXHR, textStatus, errorThrown) {
            // Display error message.
            var errorString = (errorThrown === "") ? "Error. " : errorThrown + " (" + jqXHR.status + "): ";
            errorString += (jqXHR.responseText === "") ? "" : (jQuery.parseJSON(jqXHR.responseText).message) ? 
                jQuery.parseJSON(jqXHR.responseText).message : jQuery.parseJSON(jqXHR.responseText).error.message;
            alert(errorString);
        });
}

var signUserIn = function() {
	$('.signIn').hide();
	$('.signUp').hide();
	$('.signedIn').show();

	FBApp.database().ref('finishedUploads/' + userKey).on('value', (snap)=> {
		showMyImages(snap.val());
	})
}

var showMyImages = function(images) {
	var container = $('.savedImages').empty();

	for (var image in images) {
		var imageElement = $('<img>').attr('src', images[image]);
			$(container).prepend(imageElement);
	}
}


FBApp.auth().onAuthStateChanged((data)=>{
	if (data) {
		userKey = data.uid;
		signUserIn();
	}
})




$('.signedIn').hide();