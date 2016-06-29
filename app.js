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
        let q = 1; // Quality of the thumb 0 > 1
        let sf = .5 // Scale factor
        let cs = 1 // current scale
        let rs = undefined // remaining Scale
        let ofX = 0, ofY = 0; // Offset on Draw
 
        let ctx = canvas.getContext("2d");
        let onLoad = () => {
            if (img.width / 2 > mW || img.height / 2 > mH) {
                let ts = img.width > img.height ? mW / img.width: mH / img.height;
                rs = smooth(ts);
                img = scale(img);
            } else {
                img = scale(img);
            }

            //ctx.scale(rs, rs); // Scale before set new canvas sizes!!
            canvas.width = img.width;
            canvas.height = img.height;

            if (result.startsWith("data:image/jpeg")) {
                draw();
            } else {
                applyPattern();
            }            
        }

        let scale = (image) => {
            if (image.width > mW || image.height > mH) {
                let temp = angular.element("<canvas></canvas>")[0];
                let tctx = temp.getContext("2d");
                let w = image.width;
                let h = image.height;
                let r = mW / w;
                temp.width = mW; // Set new width 
                temp.height = h * r;  // Scale height based on ratio
                h = h * r;    // Reset height to match scaled image
                w = w * r;    // Reset width to match scaled image
                // Only if the current height is still bigger than maxHeight
                if (h > mH) {
                    r = mH / h; // get ratio for scaling image
                    temp.height = mH;   // Set new height
                    temp.width = w * r;    // Scale width based on ratio
                }
                tctx.scale(r, r);
                tctx.drawImage(image, 0, 0);
                return temp;
            }
            return image;
        }

        let smooth = ts => {
            ofX = 2;
            ofY = 2;
            while (cs * sf > ts) {
                cs *= sf;
                img = stepDown(img);                
            }
            return ts / cs;
        }

        let stepDown = (image) => {
            let temp = angular.element("<canvas></canvas>")[0];
            let tctx = temp.getContext("2d");
            temp.width = image.width * sf + 1;
            temp.height = image.height * sf + 1;
            tctx.scale(sf, sf);
            tctx.drawImage(image, 0, 0);
            return temp;
        }

        let draw = () => {
            ctx.drawImage(img, 0, 0); // Draw thumb on canvas            
            // Test in explorer, base64 data uri image
            let thumb = canvas.toDataURL("image/png", q);
            deferred.resolve(thumb);
            // Blob
            //canvas.toBlob(blob=> { deferred.resolve(blob); }, "image/png", q);
        }

        let applyPattern = () => {
            let pattern = new Image();
            pattern.src = "./pattern.jpg"  // scr of pattern image
            pattern.onload = () => {
                ctx.fillStyle = ctx.createPattern(pattern, "repeat");
                ctx.fillRect(0, 0, img.width - ofX, img.height - ofY); // Drawing background ↑
                draw();
            }
        }

        let img = new Image();
        img.src = result; // Setting original as base image
        img.onload = onLoad;
        return deferred.promise;
    }
}]);