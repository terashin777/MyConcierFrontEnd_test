'use strict';

var LINE_API_URL = 'http://ec2-52-36-83-202.us-west-2.compute.amazonaws.com:9000/api';

angular.module('concierAdminApp',[])
/*
    .directive('onInitCheck', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                $timeout(function () {
                    scope.$emit('InitChange');
                });
            }
        }
    }])
*/

    .filter('startFrom', function() {
        return function(input, start) {
            start = +start; //parse to int
            return input.slice(start);
        };
    })

    .filter('tagFilter', function() {
        // 1引数callbackを受け取れるように
        return function(tag, tagList) {
            // 加工対象の値が配列であるかを判定
            if (tagList.indexOf(tag) === -1) {
                return tag;
            }
            else {
                return ;
            }
        };
    })


/*
    //↓ページの読み込み完了時に処理を実行するといったやり方ができないためカスタムのディレクティブを用いる。
    //↓ng-repeatが終わった時にinitCalPageを実行する。このディレクティブは属性（restrict: 'A'）として用いる。
    //↓linkでディレクティブの具体的な挙動を決める。
    //↓要素（E）とは、<custom-directive></custom-directive>など。属性（A）とは、<div custom-directive>のcustom-directiveなど
    //↓”$timeout(fn[, delay][, invokeApply]);”delayを設定しなければ、即時関数となる。”$emit”自分を含む上方向（親方向）へのイベント通知イベントと一緒にデータも渡すことができる
    //↓$emitによって、HTML上での親となるスコープ（ng-controllerが設定されたタグで入れ子になっている時のng-controllerを含む親要素）に対して、イベントを通知する。
    //↓$emitによって通知されるイベントは$onメソッドで受け取る。
    .directive('onFinishRender', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                if (scope.$last === true) {
                    $timeout(function () {
                        scope.$emit('initCalPage');
                        //↑scope.$emit('initCalPage');は必ず必要
                    });
                }
            }
        };
    })
*/
    .controller('UserSearchCtrl', function($scope,$http,$filter,$location,$anchorScroll){

    $("#user_message_wrapper").draggable();

    $scope.serchQuery = {
        "type": "tag",
        "queryTag": "",
        "queryText": "" 
    };

    //↓ページ数の初期化用
    //↓一度しか実行したくないものに用いる
    //$scope.numOfTry = 0;

     //↓データ取得場所指定
     $scope.selectedProductId = 1;

     //↓データ格納用
    $scope.lineUserList = [];
    $scope.userTag = [];
    $scope.currnentIndex = -1;

    //↓ユーザー数や追加するタグ数、タグの数などの格納用
    $scope.numOfUser=0;
    $scope.numOfAdd=0;
    $scope.numOfTag=0;

    //↓メッセージ操作用
    //↓メッセージ表示画面を表示/非表示用
    $scope.showMessage = false;
    $scope.messageSent = false;

    //↓タグの追加、削除用に用いる。
    $scope.currentTagText={};
    $scope.currentSelectedTag={};
    $scope.currentTagToRemove={};

    //↓現在選択中のユーザー
    //↓メッセージ閲覧、タグ編集用
    $scope.currentUser="";
    $scope.currentUserTag="";

    //↓最小やり取り数
    $scope.minLoyalty = 3;
    $scope.loyaltyStr = "3";

    //↓志望業界全表示／非表示判定用
    $scope.industryShow = false;
    $scope.industryShowIcon = "▼";

    //↓絞込み用の変数など
    //full//$scope.search = { univ_level:{}, grade:{}, preference:{}, major:{}, industry:{},operator:{}, status:{}, sex:{}, loyalty:0 , keyword:"", updated_date:"" };
    //full//$scope.selected = { univ_level:{}, grade:{}, preference:{}, major:{}, industry:{}, operator:{}, status:{}, sex:{}, loyalty:0 , keyword:"", updated_date:"" };
    //full//$scope.allFrags = { allUnivLevel:true, allGrade:true, allPreference:true, allMajor:true, allIndustry:true, allOperator:true, allStatus:true, allSex:true }
    $scope.selected = { univ_level:{10:true, 9:true, 8:true, 7:true, 6:true,0:true}, grade:{}, major:{"文系":true}, sex:{}, preference:{}, industry:{}, loyalty:0 , keyword:"", updated_at:"" };
    $scope.search = { univ_level:{}, grade:{}, major:{}, sex:{}, preference:{}, industry:{}, loyalty:0 , keyword:"", updated_at:"" };
    $scope.allFrags = { univ_level:true, grade:true, major:true, sex:true, preference:true, industry:true };
    $scope.nullTagUserFrags = { univ_level:true, grade:true, major:true, sex:true, preference:true, industry:true };
    //↓初期状態はすべてチェック状態にする。
    $scope.all = true;
    $scope.userNameText="";

    //↓ページャー機能用の変数など
    $scope.len = 50;
    $scope.start = 0;
    $scope.searchedValue = 0;
    $scope.numOfPage = 0;
    $scope.cur_page = 1;
    $scope.pager_len = 10;
    $scope.pager_start = 0;

    //↓テスト用の変数など
    $scope.testTags=[];
    $scope.testItems=[];

    //↓ソート用の変数など
    //↓$scope.lineUserListへの要素の追加の際に、$scope.iconだけで済むかと思ったが、どうやってもうまくいかなかった。
    //↓しかし、コピーして改めて$scope.sortListとして定義したものを使うとなぜかうまくいった。
    //↓$scope.iconのほうが、ソート機能と結びついているのが原因か？
    $scope.sortList = [{category: "univ"}, {category: "grade"}, {category: "major"}, {category: "preference"}, {category: "industry"}];
    $scope.icons = {name:"▼", univ:"▼", grade:"▼", major:"▼", preference:"▼", industry:"▼", loyalty:"▼", updated_at:"▼"};
    $scope.addList = [{category: "univ"}, {category:"univ_level"}, {category: "grade"}, {category: "major"}, {category: "preference"}, {category: "industry"}, {category:"updated_at"}];
    //↓選択したタグ項目でソートする時に降順にするか、昇順にするか設定する。
    $scope.re_tags = {name:true, univ:true, grade:true,major:true, sex:true, preference:true, industry:true, operator:true, status:true, loyalty:true, updated_at:true };
    $scope.sortTag = "";
    $scope.univGroupList = [{group:"東大・京大・東工大", univ_level:10}, {group:"一橋・旧帝・早慶・神大・筑波", univ_level:9}, {group:"関東上位校・ＭＡＲＣＨ", univ_level:8}, {group:"関関同立", univ_level:7}, {group:"日東駒専", univ_level:6}, {group:"その他", univ_level:0}];

    //↓タグ編集ボタン表示用
    $scope.tagAdd = false;
    $scope.tagRemove = false;

    //↓更新日によって取得するユーザーを絞り込む用
    $scope.startDate = 14;
    $scope.startDateStr = "14";

    //↓メッセージ用
    $scope.userMessages="";

    //↓管理者の情報を得る。
    $scope.asignee = localStorage.getItem("asignee");

    $scope.getLineUserList = function(){
        $http({
            url: LINE_API_URL+"/user_tag?productID=1&token=nishishinjuku",
            method:"GET",
            datatype:"json"
        }).
        success(function(d, status, headers, config) {
            var oldTag = d;
            $http({
                url: LINE_API_URL+"/user_tag?productID=2&token=nishishinjuku",
                method:"GET",
                datatype:"json"
            }).
            success(function(d, status, headers, config) {
                var newTag = d;
                newTag = newTag.concat(oldTag);
                for(var tIdx in newTag){
                    //ユーザータグリストの中のcategoryを引数として渡し，それをswichで場合わけして，実際に表示する文字列に直している。
                    newTag[tIdx].categoryText = categoryMapper(newTag[tIdx].category);
                }
                //↓ここにユーザータグが入る
                $scope.userTag = newTag;

                //var url;
                //if(!$scope.startDate){
                    //url = LINE_API_URL+"/product_user?productID="+$scope.selectedProductId+"&token=nishishinjuku";
                //}else{
                    //url = LINE_API_URL+"/product_user?productID="+$scope.selectedProductId+"&startDate="+$scope.startDate+"&token=nishishinjuku"; 
                //}
                
                var oldUrl = LINE_API_URL+"/product_user?productID=1&token=nishishinjuku";
                var newUrl = LINE_API_URL+"/product_user?productID=2&token=nishishinjuku";

                $http({
                    url: oldUrl,
                    method: "GET",
                    dataType: "json"
                }).
                success(function(data, status, headers, config) {
                    var oldUser = data; //ここにユーザーリストが入る
                    $http({
                        url: newUrl,
                        method: "GET",
                        dataType: "json"
                    }).
                    success(function(data, status, headers, config) {
                        var newUser = data;
                        $scope.lineUserList = oldUser.concat(newUser); //ここにユーザーリストが入る
                        //$scope.lineUserList = newUser;
                        $scope.numOfUser = Object.keys($scope.lineUserList).length;
                        $scope.numOfAdd = Object.keys($scope.addList).length ;
                        //↓ユーザーリストの1人1人にaddlistのタグを追加する（空のプロパティを用意する）。
                        //↓view側でソート項目と同じ順番に表示されるようにここでは明示的にループをまわして、順番どおりに配列が作られるようにしている。
                        //↓for～inだと順番が変わってしまう恐れがある。
                        for(var userIdx=0 ; userIdx<$scope.numOfUser ; userIdx++){
                            for(var addIdx=0; addIdx<$scope.numOfAdd ; addIdx++){
                                //↓if文のelseは忘れない。
                                if($scope.addList[addIdx]["category"] === "preference" || $scope.addList[addIdx]["category"] === "industry"){
                                    $scope.lineUserList[userIdx][$scope.addList[addIdx]["category"]] = [];
                                }
                                else if($scope.addList[addIdx]["category"] === "updated_at"){
                                    //↓日付の表示を整形する。
                                    $scope.lineUserList[userIdx]['updated_at'] = new Date($scope.lineUserList[userIdx]['updated_date']);
                                }
                                else{
                                    //↓nullで定義する。
                                    $scope.lineUserList[userIdx][$scope.addList[addIdx]["category"]] = null;
                                }
                            }
                            $scope.lineUserList[userIdx]["isArt"] = false;
                        }
                        
                        $scope.numOfTag = Object.keys($scope.userTag).length;

                        //↓タグを持つユーザーだけを抽出する
                        //$scope.lineHasTagUserList = $filter("filter")($scope.lineUserList, {
                            //user_tag: ""
                        //});
                        //↓ユーザー1人1人にソート項目の要素を追加する。
                        //↓new Dateしたobjectを用いないとソートできない。
                        for(userIdx in $scope.lineUserList){
                            //↓加えるソート項目の数だけループを回し、ソート項目の中にあるタグであるかどうか判定する。
                            for(addIdx in $scope.addList){
                                //↓タグリストの中からタグの数だけループを回し、ユーザーの持つタグIDと一致するIDを持つタグを探す。
                                for(var tagIdx in $scope.userTag){
                                    //↓userTagのcategoryが空のは、ループの次に進む。
                                    if(!$scope.userTag[tagIdx]["category"]){
                                        continue;
                                    }
                                    //↓indexOfを用いる時は必ず、文字列があることを確認してから行う。
                                    //↓ここでは、$scope.userTag[tagIdx]["category"] && がそれにあたる。
                                    //↓addListに含まないcategoryのものは、ユーザーのプロパティに追加しない。
                                    //↓タグのcategoryが現在回しているaddlistのcategoryと異なる場合は、以下の処理を実行しない。
                                    //↓indexOfを用いているのは、categoryがmajor_artまたはmajor_sciであるものを同じものとみなすため。
                                    //↓indexOfを用いれば他のcategoryと区別しなくてよくなるため、majorのときだけ分岐するif文がいらなくなる。
                                    else if($scope.userTag[tagIdx]["category"] && $scope.userTag[tagIdx]["category"].indexOf($scope.addList[addIdx]["category"]) === -1){
                                        continue;
                                    }
                                    else if($scope.addList[addIdx]["category"] !== "" && $scope.addList[addIdx]["category"].indexOf("univ") === -1){
                                            //↓categoryがunivまたはuniv_levelでなければselectedをtrueにする。
                                            $scope.selected[$scope.addList[addIdx]['category']][$scope.userTag[tagIdx]['name']]=true;
                                    }
                                    //↓ユーザーのタグの数だけループを回し、ユーザーの持つ1つ1つのタグIDがどんなタグであるかを判定する。
                                    for(var userTagIdx in $scope.lineUserList[userIdx].user_tag){
                                        //↓ユーザーの持つタグとタグリストのタグのidが一致するか判定し、一致すればユーザーのそれに応じたカテゴリーのプロパティに値を代入する。
                                        if($scope.lineUserList[userIdx].user_tag[userTagIdx] == $scope.userTag[tagIdx].id){
                                            if($scope.userTag[tagIdx].name !== ""){
                                                if($scope.addList[addIdx]["category"] === "preference" || $scope.addList[addIdx]["category"] === "industry"){
                                                     $scope.lineUserList[userIdx][$scope.addList[addIdx]["category"]].push($scope.userTag[tagIdx].name);
                                                }
                                                else{
                                                    //↓userTagのnameが空でなければ、lineUserListのそれぞれのカテゴリーのプロパティに値を代入する。
                                                    $scope.lineUserList[userIdx][$scope.addList[addIdx]["category"]] = $scope.userTag[tagIdx].name;
                                                }
                                                if($scope.userTag[tagIdx].category === "major_art"){
                                                    $scope.lineUserList[userIdx]["isArt"] = true;
                                                }
                                                if($scope.userTag[tagIdx].category === "univ"){
                                                    switch ($scope.userTag[tagIdx].id){
                                                        //↓上から東大、京大、東工大のｉｄ
                                                        case 24:
                                                        case 215:
                                                        case 26:
                                                        case 217:
                                                        case 6:
                                                        case 198:
                                                            $scope.lineUserList[userIdx].univ_level = 10;
                                                            break;
                                                        //↓上から一橋、早稲田、慶応、阪大、東北大、名大、九大、北大、神戸、筑波（下2つ）のｉｄ
                                                        case 29:
                                                        case 220:
                                                        case 40:
                                                        case 231:
                                                        case 3:
                                                        case 195:
                                                        case 27:
                                                        case 218:
                                                        case 4:
                                                        case 196:
                                                        case 25:
                                                        case 216:
                                                        case 5:
                                                        case 197:
                                                        case 11:
                                                        case 202:
                                                        case 28:
                                                        case 219:
                                                        case 23:
                                                        case 180:
                                                        case 214:
                                                        case 366:
                                                            $scope.lineUserList[userIdx].univ_level = 9;
                                                            break;
                                                        //↓上から横国、上智、理科大、工学院、電通、明大、青学、立教大学、中央大学、法政大学（下2つ）のｉｄ
                                                        case 126:
                                                        case 314:
                                                        case 30:
                                                        case 221:
                                                        case 9:
                                                        case 200:
                                                        case 103:
                                                        case 294:
                                                        case 37:
                                                        case 228:
                                                        case 110:
                                                        case 299:
                                                        case 35:
                                                        case 226:
                                                        case 122:
                                                        case 310:
                                                        case 31:
                                                        case 222:
                                                        case 39:
                                                        case 125:
                                                        case 230:
                                                        case 313:
                                                            $scope.lineUserList[userIdx].univ_level = 8;
                                                            break;
                                                        //↓上から関西大学、立命館大学のｉｄ
                                                        case 119:
                                                        case 307:
                                                        case 177:
                                                        case 363:
                                                            $scope.lineUserList[userIdx].univ_level = 7;
                                                            break;
                                                        //↓上から日大、東洋大のｉｄ
                                                        case 129:
                                                        case 317:
                                                        case 179:
                                                        case 365:
                                                            $scope.lineUserList[userIdx].univ_level = 6;
                                                            break;
                                                        default:
                                                            $scope.lineUserList[userIdx].univ_level = 0;
                                                            break;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        //↓上でtrueにしているので、これは必要ない
                        //for(var category in $scope.selected){
                            //$scope.onChange(category, true);
                        //}
                        $scope.runSearch();
                    }).
                    error(function(data, status, headers, config) {
                    });
                }).
                error(function(data, status, headers, config) {
                });
            }).
            error(function(data, status, headers, config) {
            });
        }).
        error(function(data, status, headers, config) {
        });
    };

    //$scope.add = function(){
        //$scope.numOfUser = Object.keys($scope.lineUserList).length;
        //$scope.numOfAdd = Object.keys($scope.addList).length ;
        //↓配列の追加実験
        //for(var u = 0; u<$scope.testnum; u++){ 
            //for(var t = 0; t<$scope.numicon; t++){ 
                //$scope.test[u][$scope.icon[t]["category"]] = "";
            //}
        //}
        //for(var u = 0; u<$scope.testnum; u++){
            //for(var t = 0; t<$scope.testlistnum; t++){ 
                //$scope.test[u][$scope.testlist[t]["category"]] = "";
            //}
        //}
        //$scope.test[1] = {one: "haru"};
        //$scope.test[2] = {one: "haru"};
        //$scope.test[3] = {};
        //$scope.test[3][$scope.testlist[0]["A"]] = "success";
        //[{}]のようになっている時、{}の中にどちらも変数の'キー：要素'を追加したい時は、'配列[インデックス番号][キー]=要素'とする。
        //[{}]において、{}の外に{}を追加して{}の中に要素を入れたい時は、まず'配列[インデックス番号]={}'として、{}を追加し、その次に'配列[追加した{}のインデックス番号][キー]=要素'で追加する。
        //for(var p = 0; p< $scope.numuser; p++){
            //for(var q = 0; q<$scope.numicon; q++){
               // $scope.lineUserList[p][$scope.icon[q]["category"]] = "";
           // }
        //}
        //for(var p = 0; p< $scope.numOfUser; p++){
            //for(var q = 0; q<$scope.numOfAdd; q++){
                //$scope.lineUserList[p][$scope.addList[q]["category"]] = "";
            //}
        //}
    //};

    $scope.getLineUserList();

    $scope.gotoTop = function (){
        // set the location.hash to the id of
        // the element you wish to scroll to.
        $location.hash('top');
        // call $anchorScroll()
        $anchorScroll();
    };
    
    //↓ページに表示するとき、何から表示を始めるか設定する。
    $scope.pager = function(page){
        $scope.start = $scope.len * page;
        $scope.cur_page = page+1;
    };

/*
    //↓イベント監視を行う。指定のイベント（ここでは、initCalPage）が発生した際に実行されるリスナーを登録できる。
    //↓pageCalが呼び出されるたびに実行してしまうので、numOfTryを使って読み込みごとに一回だけ実行されるようにしている。
    $scope.$on('initCalPage', function(len) {
        if ($scope.numOfTry === 0) {
            $scope.numOfPage = Math.ceil( $scope.searchedValue/$scope.len);
            $scope.numOfTry += 1;
        }
    });
*/

    //↓len（1ページあたり表示する件数）とsearchedValue（表示件数）が変化するたびにページ数を計算しなおす
    /*
    $scope.$watchGroup([
        "len",
        "searchedValue"
    ], function() {
        $scope.numOfPage = Math.ceil( $scope.searchedValue/$scope.len);
        $scope.start = 0;
        $scope.pager_start = 0;
        $scope.cur_page = 1;
    });
    */

    $scope.$watch('len', function(newVal, oldVal) {
        $scope.numOfPage = Math.ceil( $scope.searchedValue/$scope.len);
        $scope.start = 0;
        $scope.pager_start = 0;
        $scope.cur_page = 1;
    });

    $scope.$watch('searchedValue', function(newVal, oldVal) {
        $scope.numOfPage = Math.ceil( $scope.searchedValue/$scope.len);
        $scope.start = 0;
        $scope.pager_start = 0;
        $scope.cur_page = 1;
    });

    //↓最初のページに移動する。
    $scope.firstPage =function() {
        $scope.pager_start = 0;
        $scope.start = 0;
        $scope.cur_page = 1;
    };

    //↓最後のページに移動する。
    $scope.lastPage = function() {
        //var pageVol = Math.ceil( numOfPage/10 );
        if($scope.numOfPage>10){
            $scope.pager_start = $scope.numOfPage - 9;
        }
        else{
            $scope.pager_start = 0;
        }
        $scope.start =  $scope.len * ($scope.numOfPage - 1);
        $scope.cur_page = $scope.numOfPage;
    };


    $scope.filterTagProp = function(tag) {
        if (tag.id >= 193){
            return true;
        }
        else{
            return false;
        }
    };

    $scope.overlapCheck = function(tag) {

    };

    //↓ページのインデックス番号を表示するための配列を作る。
    //↓injectorがすべてのモジュールをロード完了時に実行すべき内容を登録。
    //↓アプリケーションの初期化に使用する。
    //↓$rootScopeはアプリケーション全体で共有される。
    //↓ただの数をng-repeatで繰り返すために、配列を作っている。
    $scope.arrOfPage = function(n) {
        var arr = [];
        for (var i=0; i<n; i++) {
            arr.push(i);
        }
        return arr;
    };

    //↓絞り込み用の志望業界のタグを表示/非表示する。
    $scope.showIndustryTag = function(){
        $scope.industryShow = !$scope.industryShow;
        //↓▲アイコンの向きを変える。
        if($scope.industryShow){
            $scope.industryShowIcon='▲';
        }
        else{
            $scope.industryShowIcon='▼';
        }
    };

    //↓タグ追加ウィンドウを表示にする。
    $scope.openTagAddField = function(user, tag){
        $scope.currentUser = user;
        $scope.currentUserTag = tag;
        $scope.tagRemove = false;
        $scope.tagAdd = true;
        $scope.showMessage = false;
    };

    //↓タグの削除ウィンドウを表示する。
    $scope.openTagRemoveField = function(user, tag){
        $scope.currentUser = user;
        $scope.currentUserTag = tag;
        $scope.tagAdd = false;
        $scope.tagRemove = true;
        $scope.showMessage = false;
    };

    //↓タグの編集ウィンドウを非表示にする。
    $scope.cancelEditTag = function(){
        $scope.currentUser = "";
        $scope.currentUserTag = "";
    };

    //↓タグの追加
    $scope.addNewTag = function(){
        //↓入力されたタグのテキストを受け取る。
        var tagText = $scope.currentTagText[$scope.currentUser.id];
        //↓現在選択中の既存のタグのIDを受け取る。
        var selectedTag = parseInt($scope.currentSelectedTag[$scope.currentUser.id]);

        //↓追加するタグが空または定義されていなければ実行する。
        if(tagText != "" && tagText != undefined){
            //↓入力欄のテキストを初期化する。
            $scope.currentTagText[$scope.currentUser.id] = "";
            var tagId;
            for(var i in $scope.userTag){
                //↓もし入力されたタグ名がすでに存在していれば、tagIdにそのタグのIDを入れる。
                if($scope.userTag[i].name==tagText){
                    tagId = $scope.userTag[i].id;
                }
            }
            //↓tagIdが存在すれば以下を実行する。
            if(tagId){
                //↓tagIdと同じIDをユーザーがすでに持っていれば何もしない。
                if($scope.currentUser.user_tag.indexOf(tagId)!=-1){
                    return;
                //↓tagIdと同じIDをユーザーがもっていなければ、タグのIDを追加する。
                }else{
                    $scope.currentUser.user_tag.push(tagId);
                }
                var url = LINE_API_URL+"/user/"+$scope.currentUser.id;
                $http({
                    url: url,
                    method: "PUT",
                    dataType: "json",
                    data: {"user_tag": $scope.currentUser.user_tag}
                }).
                success(function(data, status, headers, config) {
                    //$scope.getLineUserList(); 
                }).
                error(function(data, status, headers, config) {
                });  

            }else{
                $http({
                    url: LINE_API_URL+"/user_tag",
                    method: "POST",
                    dataType: "json",
                    data: {"productID": 1,"tagName": tagText}
                }).
                success(function(data, status, headers, config) {
                    if($scope.currentUser.user_tag.indexOf(data.id)!=-1){
                        return;
                    }else{
                        $scope.currentUser.user_tag.push(data.id);
                    }
                    var url = LINE_API_URL+"/user/"+$scope.currentUser.id;
                    $http({
                        url: url,
                        method: "PUT",
                        dataType: "json",
                        data: {"product":$scope.selectedProductId , "user_tag": $scope.currentUser.user_tag}
                    }).
                    success(function(data, status, headers, config) {
                        //$scope.getLineUserList(); 
                    }).
                    error(function(data, status, headers, config) {
                    });  
                }).
                error(function(data, status, headers, config) {
                });
            }
        //↓選択されたタグが空または定義されていなければ何もしない。
        }else if(selectedTag != "" && selectedTag != undefined){
            if($scope.currentUser.user_tag.indexOf(selectedTag)!=-1){
                return;
            }else{
                $scope.currentUser.user_tag.push(selectedTag);
            }
            var url = LINE_API_URL+"/user/"+$scope.currentUser.id;
            $http({
                url: url,
                method: "PUT",
                dataType: "json",
                data: {"product":$scope.selectedProductId , "user_tag": $scope.currentUser.user_tag }
            }).
            success(function(data, status, headers, config) {
                //$scope.getLineUserList(); 
            }).
            error(function(data, status, headers, config) {
            });
        }
    };

    //↓タグの削除を実行し、lineUserlistを更新する。
    $scope.removeTag = function(category){
        if(window.confirm('削除してよろしいですか？')){
        }
        else{
            return;
        }
        //↓currentTagToRemove[$scope.currentUser.id]には削除するタグのIDが入る。
        var tagToRemove = parseInt($scope.currentTagToRemove[$scope.currentUser.id]);
        var removeIndex = $scope.currentUser.user_tag.indexOf(tagToRemove);

        var tagNameToRemove = $scope.getTagName($scope.currentTagToRemove[$scope.currentUser.id]);
        var removeNameIndex = $scope.currentUser[category].indexOf(tagNameToRemove);

        $scope.currentUser.user_tag.splice(removeIndex, 1);

        if (category === "univ") {
            $scope.currentUser[category] = "";
        }
        else if (category === "preference" || category === "industry") {
            $scope.currentUser[category].splice(removeNameIndex, 1);
        }
        else {
            $scope.currentUser[category] = "";
        }

        $scope.currnentIndex = -1;
        var url = LINE_API_URL+"/user/"+$scope.currentUser.id;
        $http({
            url: url,
            method: "PUT",
            dataType: "json",
            data: {"product":$scope.selectedProductId , "user_tag": $scope.currentUser.user_tag }
        }).
        success(function(data, status, headers, config) {
            $scope.getLineUserList();
        }).
        error(function(data, status, headers, config) {
        });

    };

    //↓タグの名前をタグのIDから取得する。
    $scope.getTagName = function(tagId){
        for(var i in $scope.userTag){ //全タグリストをループし，引数として渡されたタグIDと一致するタグの名前を探す．
            if($scope.userTag[i].id == tagId){
                return $scope.userTag[i].name;
            }
        }
        return "";
    };

    //↓タグのIDをタグの名前から取得する。
    $scope.getTagId = function(tagName){
        //↓全タグリストをループし，引数として渡されたタグ名と一致するタグIDを探す．
        for(var i in $scope.userTag){
            if($scope.userTag[i].name == tagName){
                return $scope.userTag[i].id;
            }
        }
        /*↓上のforループで該当するものがなければ以下を実行する。
            絞り込みで、全て表示を実装するには、ここはnullではなく、””でなくてはならない。下のフィルタの、if($scope.search.univ != "")での""と対応している。
            両方ともnullにするという手も考えられるが、初期値が””なのでうまくいかない。初めの変数宣言で初期値をnullにすればnullでも問題ない。*/
        return "";
    };

     //↓ユーザーのタグをクリックすることで検索をかけることができる。
    $scope.filterUser = function(item) {//タグなし実行時
        if($scope.serchQuery.type == "tag" && $scope.serchQuery.queryTag != ""){
            var tagId = $scope.getTagId($scope.serchQuery.queryTag); //タグIDを取得する
            if(tagId){
                return item.user_tag.indexOf(tagId) != -1; //タグIDが初めに現れたインデックス番号を取得する indexOfは検索したもの（ここではtagId）がなければ-1を返す
            }else{
                return -1;
            }
            return true;
        }else{
            return -1;
        }
    };

    //↓検索するタイプを指定し，serchQuery.queryTagに引数として渡されたタグIDからタグの名前を代入する。
    $scope.searchByTag = function(tag){ 
        $scope.serchQuery.type = "tag";
        $scope.serchQuery.queryTag = tag;
    };

/*
    //↓filterUserにキーワードを渡して、キーワード検索を行う。
    //↓インクリメントサーチ
    $scope.searchByText = function(){
        $scope.serchQuery.type = "text";
        $scope.serchQuery.queryText = $scope.userNameText;
    };
*/

/*
    //↓最小やり取り数による検索
    $scope.minLoyaltyUpdate = function(){
        //↓parseIntは第一引数に入れられ文字列を第二引数に入れた基数を元に整数にする。
        $scope.minLoyalty = parseInt($scope.loyaltyStr);
    };
*/

    //↓selectedに入れられたものをsearchに入れて、絞込みを実行する。
    $scope.runSearch = function() {
        /*if($scope.user_univ.name == ""){
            $scope.search.user_univ = "";
            //$scope.search.user_univ = $scope.user_univ;
        }else{
            $scope.search.user_univ = $scope.user_univ.name;
            //$scope.search.user_univ = $scope.user_univ;
        }*/
        for(var tagGroup in $scope.selected){
            for(var item in $scope.selected[tagGroup]){
                $scope.search[tagGroup][item] = $scope.selected[tagGroup][item];
            }
        }
        //↑下のようにすると参照渡しになり、searchとselectedが同じものとなってしまうため、上のようにして値渡しにしている。
/*        $scope.search.grade      = $scope.selected.grade;
        $scope.search.preference = $scope.selected.preference;
        $scope.search.major_art  = $scope.selected.major_art;
        $scope.search.major_sci  = $scope.selected.major_sci;
        $scope.search.industry   = $scope.selected.industry;
        $scope.search.sex        = $scope.selected.sex;
        $scope.search.operator   = $scope.selected.operator;
        $scope.search.status     = $scope.selected.status;
        $scope.search.univ_level        = $scope.selected.univ_level;
*/
        $scope.search.keyword        = $scope.selected.keyword;
        $scope.serchQuery.queryTag = "";
        $scope.serchQuery.queryText = "";
    };

     //↓すべてチェックが押される（allがtrue）なら、チェックボックスをすべてチェックする。
     //↓解除（allがfalse）がらチェックボックスのチェックをすべてはずす。
     //↓それぞれ押されたものに応じてsearchの内容を変更して、絞込みを実行する。
    $scope.allCheck = function(all) {
        //↓解除が押された時は、
        if(!all){
                //↓絞込みを解除した後、検索を押すと選択されていないのに絞込みが行われてしまうので、selectedも初期化する必要がある。
                $scope.selected.loyalty    = "";
                $scope.selected.keyword        = "";

                $scope.search.loyalty    = "";
                $scope.search.keyword        = "";
                $scope.serchQuery.queryTag = "";
                $scope.serchQuery.queryText = "";
        }
        for(var category in $scope.search){
            if(all){
                $scope.allFrags[category] = true;
            }
            //↓絞込みを解除
            else{
                $scope.allFrags[category] = false;
                //↓frmという名前をつけたフォームを初期化（チェックをはずしたり、入力欄を空にしたり）する。
                //document.frm.reset();
            }
            if(category == "sex" || category == "loyalty" || category == "keyword" || category == "updated_at"){
                continue;
            }
                $scope.onChange(category, $scope.allFrags[category]);
        }
        //↓絞込みの実行
        $scope.runSearch();
    };

    $scope.onChange = function(category, allFrag){
         for(var idx in $scope.selected[category]){
            if(allFrag){
                $scope.selected[category][idx] = true;
            }
            else{
                $scope.selected[category][idx] = false;
            }
        }
    };

     //↓タグによる絞込み
    $scope.filterByTag = function(user){
        //↓フィルターごとではなく、ユーザーごとにフィルターの処理を実行しなくては、動作が遅くなる。
        //↓フィルターごとにタグリストを参照するループ関数が含むことになるため。
        var trueFrag = false;
        for(var tagGroup in $scope.search){
            if(tagGroup === "sex" || tagGroup === "loyalty" || tagGroup === "keyword" || tagGroup === "updated_at"){
                continue;
            }
            else if(tagGroup === "major"){
                trueFrag = false;
                if($scope.nullTagUserFrags[tagGroup] && user[tagGroup] == null){
                    trueFrag = true;
                    continue;
                }
                //↓タグ名がtagに入る。
                for(var tag in $scope.search[tagGroup]){
                    if($scope.search[tagGroup][tag]){
                        //↓majorだけは別処理
                            if(tag === "文系"){
                                if(user["isArt"]){
                                    trueFrag = true;
                                    continue;
                                }
                            }
                            else{
                                if(user[tagGroup] == tag){
                                    trueFrag = true;
                                    continue;
                                }
                            }
                        }
                }
                if(!trueFrag){
                    return false;
                }
            }
            else if(tagGroup === "preference" || tagGroup === "industry"){
                trueFrag = false;
                //↓user[tagGroup]の配列の長さが1、つまり何もプロパティが追加されていないものは、該当するtagGroupに属するタグを持たない。
                //↓こうしたユーザーはタグなしにチェックが入れられていない限り、はじく。
                if($scope.nullTagUserFrags[tagGroup] && user[tagGroup].length === 0){
                    trueFrag = true;
                    continue;
                }
                //↓lineUserListのなか"univ_level"が一致するものでフィルターをかけている。
                //↓選択されたuniv_levelのどれかと一致しない、かつタグなし含むにチェックが入れられていない時はfalseを返してそのユーザーをはじく。
                //↓タグの分類ごとにreturn false;が設定されているので、AND検索。
                //↓どれか一つの分類でfalseが返されたら、そのユーザーをはじく。
                //↓どの分類でもfalseを返されずに最後まで残ったユーザーに対してのみtrueが返されて、表示される。
                for(tag in $scope.search[tagGroup]){
                    if($scope.search[tagGroup][tag]){
                        if(user[tagGroup].indexOf(tag) !== -1){
                            trueFrag = true;
                            continue;
                        }
                    }
                }
                if(!trueFrag){
                    return false;
                }
            }
            //↓major以外の処理
            else{
                trueFrag = false;
                if($scope.nullTagUserFrags[tagGroup] && user[tagGroup] == null){
                    trueFrag = true;
                    continue;
                }
                //↓lineUserListのなか"univ_level"が一致するものでフィルターをかけている。
                //↓選択されたuniv_levelのどれかと一致しない、かつタグなし含むにチェックが入れられていない時はfalseを返してそのユーザーをはじく。
                //↓タグの分類ごとにreturn false;が設定されているので、AND検索。
                //↓どれか一つの分類でfalseが返されたら、そのユーザーをはじく。
                //↓どの分類でもfalseを返されずに最後まで残ったユーザーに対してのみtrueが返されて、表示される。
                for(tag in $scope.search[tagGroup]){
                    if($scope.search[tagGroup][tag]){
                        if(user[tagGroup] == tag){
                            trueFrag = true;
                            continue;
                        }
                    }
                }
                if(!trueFrag){
                    return false;
                }
            }
        }
        return true;
    };

    //↓最小やり取り数による絞込み
    $scope.filterByLoyalty = function(user) {
        return user.loyalty >= $scope.search.loyalty;
    };

    //↓キーワードによる絞込み
    //↓インクリメントサーチにするなら必要ない。
    $scope.filterByKeyword = function(user) {
         if($scope.search.keyword != ""){
              return $user == $scope.search.keyword; 
        }else{
            return -1;
        }
    };

    //↓更新日時による絞込み
    $scope.filterByDate = function(user) {//タグなし実行時
        return user.updated_at >= $scope.search.updated_at;
    };

    $scope.minLoyaltyUpdate = function(){
        $scope.minLoyalty = parseInt($scope.loyaltyStr);
    };

    $scope.startDateUpdate = function(){
        $scope.startDate = parseInt($scope.startDateStr);
        $scope.getLineUserList();
    };

    //↓ユーザーのメッセージを取得
    $scope.getUserMessages = function(user){
        //↓ユーザーのIDに応じたメッセージを取得
        var url = LINE_API_URL+"/user/"+user.id+"/message";
        $http({
            url: url,
            method: "GET",
            dataType: "json",
        }).
        //↓取得したメッセージがdataに格納される。
        success(function(data, status, headers, config) {
            for(var i in data){
                data[i]['datetime'] = timeConverter(data[i]['updated_date']);
            }
            //↓取得したメッセージをインスタンス変数に格納する
            $scope.userMessages = data;
            //↓選択したユーザーをcurrentUserとする
            $scope.currentUser = user;
            //↓メッセージ閲覧画面を表示
            $scope.showMessage = true;
            //↓メッセージの送信はしない
            $scope.messageSent = false;
            //↓アコーディオン用
            //↓タグ追加ウィンドウを非表示にする
            $scope.tagAdd = false;
            //↓タグ削除ウィンドウを非表示にする
            $scope.tagRemove = false;
        }).
        //↓エラーの時は何もしない
        error(function(data, status, headers, config) {
        });
    };

    $scope.updateUserDesc = function(user){
        var desc = $("#user_desc_"+user.id).val();
        if (desc==""){
            desc = null;
        }

        var url = LINE_API_URL+"/user/"+user.id;

        $http({
            url: url,
            method: "PUT",
            dataType: "json",
            data: {"product": $scope.selectedProductId, "description": desc}
        }).
        success(function(data, status, headers, config) {
            alert("メッセージが反映されました。");
        }).
        error(function(data, status, headers, config) {
          
        });  
      }

    //↓メッセージウィンドウを閉じる。
    $scope.closeMessageWindow = function(){
        $scope.userMessages = undefined;
        $scope.showMessage = false;
        $scope.messageSent = false;
    };

    //↓lineUserListを更新する。
    $scope.updateProduct = function(){
        $scope.getLineUserList();
    };

    //↓メッセージを送信する。
    $scope.submitMessage = function(userId){
        var asignee = $scope.asignee;
        //↓asigneeが空であれば，何もせずに戻る
        if(!asignee){
            return;
        }
        //↓localStrageにキーがasignee，要素が$scope.asigneeの配列を保存する．
        localStorage.setItem("asignee", $scope.asignee);
        //↓text_area_wrapperというidを持つタグの中のtext_areaというidを持つタグのvalueを取ってくる．
        var messageText = $("#text_area_wrapper > #text_area").val();
        if (!messageText || messageText === "") {
            return;
        }
        //↓messageTextが空であれば，何もせずに戻る．
        var url = LINE_API_URL+"/response_message";
        $http({
            url: url,
            method: "POST",
            dataType: "json",
            data: {"user": userId, "asignee": asignee, "message": messageText, "productId": $scope.selectedProductId}
        }).
        success(function(data, status, headers, config) {
            $scope.messageSent = true;
            //↓valueを空にしている．
            $("#text_area_wrapper > #text_area").val("");
        }).
        error(function(data, status, headers, config) {
        });
    };

/*
    $scope.displayedResult = function(display, limit) {
        return result = Math.floor(display/limit) + 1;
    };
*/
    
    $scope.getFullText = function(item){
        return ;
    }

    $scope.isTruncated = function(item){
        return item.text.length >= 86;
    }

    //↓lineUserListを更新した時と、tagSortを実行した時に実行する。
    $scope.runSort = function(exp, reverse){
        $scope.lineUserList = $filter('orderBy')($scope.lineUserList, exp, reverse);
    };

    //↓booleanの反転は変数の前に"!"をつけて代入する。
    //↓runSortでソートを実行し、それと同時にソート項目の横にある▲アイコンの向きを変えている。
    $scope.tagSort = function(exp, reverse){
        $scope.runSort(exp, reverse);
        for(var icon in $scope.icons){
            if(icon != exp){
                $scope.icons[icon] = "▼";
            }
        }
        if(exp === "name"){
            if(reverse){
                $scope.icons[exp] = "▲";
            }
            else{
                $scope.icons[exp]  = "▼";
            }
        }
        else{
            if(reverse){
                $scope.icons[exp] = "▼";
            }
            else{
                $scope.icons[exp]  = "▲";
            }
        }
        $scope.re_tags[exp] = !reverse;
        return $scope.icons[exp];
    };

    //↓アイコンのカテゴリーに対応するユーザーのタグが空でなければ、そのタグの名前を返す。
    //↓もし空であれば、スペースを返す。
    //↓スペースを返さないと、スタイルが崩れてしまう。
    $scope.getSortTag = function(icCategory, item){
        if(item[icCategory] !== ""){
            return item[icCategory];
        }
        else{
            return "　";
        }
    };

    $scope.majorOrder = function(major) {
        var order = { '機械': 0, '電気': 1, '情報': 2, '建築・土木・社会工学': 3 };
        return order[major.name];
    };

    $scope.industryOrder = function(industry) {
        var order = { '機械・重工': 0, '自動車' : 1, '自動車部品': 2, '鉄道': 3, '輸送用機器': 4, '電機機器': 5, 'テレビ': 6, '精密機器': 7, '住宅設備機器': 8, '医療機器': 9, 'その他メーカー': 10, '通信サービス': 11, 'SIer': 12, 'ゲーム': 13, '建築': 14, '化学': 15, '医薬品': 16, '化粧品': 17, '電力・ガス': 18, '鉄鋼': 19, '素材':20 };
        return order[industry.name];
    };

});

    function timeConverter(UNIX_timestamp){
        var a = new Date(UNIX_timestamp);
        var months = ['1','2','3','4','5','6','7','8','9','10','11','12'];
        var year = a.getFullYear();
        var month = months[a.getMonth()];
        var date = a.getDate();
        var hour = a.getHours();
        var min = a.getMinutes();
        var sec = a.getSeconds();
        var time = year + '/' + month + '/' + date + ' ' + hour + ':' + min  ;
        return time;
    };

    function categoryMapper(cat){
      switch (cat){
        case "univ":
          return "大学"
          break;
        case "sex":
          return "性別"
          break;
        case "position":
          return "志望ポジション"
          break;     
        case "preference":
          return "志向性"
          break;       
        case "major_sci":
          return "専攻（理系）"
          break;       
        case "major_art":
          return "専攻（文系）"
          break;     
        case "location":
          return "希望勤務地"
          break;  
        case "industry":
          return "志望業界"
          break;  
        case "grade":
          return "学年"
          break;
        case "intelligence":
          return "所感"
          break;    
        case "operator":
          return "担当者"
          break;      
        default:
          return "その他"
          break;  
      }
    };