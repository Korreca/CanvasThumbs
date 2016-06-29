angular
.module("app", ["ui.event"])
.controller("appController", ["$scope", "thumbService", ($scope, thumbService) => {
    $scope.image = {
        original: "",
        thumb: ""
    };
    $scope.handleImageSelect = (evt) => {
        evt.stopPropagation();
        let file = evt.currentTarget.files[0];

        // this reader should be generated on the service, and passed file as argument, not the result //
        let reader = new FileReader();                                                                 //
        reader.onload = function (evt) {                                                               //
            $scope.$apply(function ($scope) {                                                          // 
                $scope.image.original = evt.target.result;                                             //
            });                                                                                        //
            thumbService.generate(evt.target.result).then((result) => {                                //
                $scope.image.thumb = result;                                                           //
            });                                                                                        //
        };                                                                                             //
        reader.readAsDataURL(file);                                                                    //
        /////////////////////////////////////////////////////////////////////////////////////////////////
    };
}])
.service("thumbService", ["$q", function ($q) {
    this.generate = (result) => {
        let deferred = $q.defer();
        let canvas = angular.element("<canvas></canvas>")[0];

        // Should be tested before
        // Test in explorer
        if (typeof canvas.toDataURL !== "function") {
            deferred.resolve(new Error("not supported"));
        }
        // Blob 
        //if (typeof canvas.toBlob !== "function") {
        //    deferred.resolve(new Error("not supported"));
        //}

        // General options
        let mW = 400; // Max width for the image
        let mH = 600;    // Max height for the image
        let q = .9; // Quality of the thumb 0 > 1

        let ctx = canvas.getContext("2d");

        let onLoad = () => {
            let w = img.width;    // Current image width
            let h = img.height;  // Current image height
            let r = mW / w;  // Used for aspect ratio | get ratio for scaling image


            // Only if the current image needs resize
            if (img.width > mW || img.height > mH) {
                img.width = mW; // Set new width 
                img.height = h * r;  // Scale height based on ratio
                h = h * r;    // Reset height to match scaled image
                w = w * r;    // Reset width to match scaled image
                // Only if the current height is still bigger than maxHeight
                if (h > mH) {
                    r = mH / h; // get ratio for scaling image
                    img.height = mH;   // Set new height
                    img.width = w * r;    // Scale width based on ratio
                    w = w * r;    // Reset width to match scaled image
                    h = w * r;    // Reset height to match scaled image
                }
            }// else {
            // deferred.resolve(new Error("No thumbs needed"));
            //}
            canvas.width = img.width; // Set final thumb width on canvas
            canvas.height = img.height; // Set final thumb height on canvas

            //if can have alpha channel
            if (result.startsWith("data:image/jpeg")) {
                draw(); // No alpha
            } else {
                applyPattern(); // Alpha
            }
        }

        let draw = () => {
            ctx.drawImage(img, 0, 0, img.width, img.height); // Draw thumb on canvas
            // Test in explorer, base64 data uri image
            let thumb = canvas.toDataURL("image/jpg", q);
            deferred.resolve(thumb);
            // Blob
            //canvas.toBlob(blob=> { deferred.resolve(blob); }, "image/jpg", q);
        }

        let applyPattern = () => {
            let pattern = new Image();
            pattern.src = "./pattern.jpg"  // scr of pattern image
            pattern.onload = () => {
                ctx.fillStyle = ctx.createPattern(pattern, "repeat");
                ctx.fillRect(0, 0, img.width, img.height); // Drawing background ↑                
                draw();
            }
        }

        let img = new Image();
        img.src = result; // Setting original as base image
        img.onload = onLoad;
        return deferred.promise;
    }
}]);