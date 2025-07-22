// 定义云端JSON数据的基础URL
// 这里我们假设您的GitHub Pages地址，请根据实际情况修改
const BASE_URL = 'https://xyy1090091952.github.io/MeowBread_database/';

// 获取所有词典的原始数据
// 注意：我们直接在这里定义数据，而不是用 require, 方便后续处理
let data = {
    "dictionaries": [
        {
            "id": "everyones_japanese",
            "name": "大家的日语",
            "description": "大家的日语",
            "cover_image": "https://free.picui.cn/free/2025/07/20/687bd47160e75.jpg",
            "lesson_files": [], // 将被动态填充
            "volumes": [
                {"id":"volume1","name":"第一册","description":"29-37课","lessons":[26,27,28,29,30,31,32,33,34,35,36,37]},
                {"id":"volume2","name":"第二册","description":"38-50课","lessons":[38,39,40,41,42,43,44,45,46,47,48,49,50]}
            ],
            "courses": [
                {"courseNumber":26,"courseTitle":"第26课","lessonFile":"lesson26","description":"大家的日语第26课"},
                {"courseNumber":27,"courseTitle":"第27课","lessonFile":"lesson27","description":"大家的日语第27课"},
                {"courseNumber":28,"courseTitle":"第28课","lessonFile":"lesson28","description":"大家的日语第28课"},
                {"courseNumber":29,"courseTitle":"第29课","lessonFile":"lesson29","description":"大家的日语第29课"},
                {"courseNumber":30,"courseTitle":"第30课","lessonFile":"lesson30","description":"大家的日语第30课"},
                {"courseNumber":31,"courseTitle":"第31课","lessonFile":"lesson31","description":"大家的日语第31课"},
                {"courseNumber":32,"courseTitle":"第32课","lessonFile":"lesson32","description":"大家的日语第32课"},
                {"courseNumber":33,"courseTitle":"第33课","lessonFile":"lesson33","description":"大家的日语第33课"},
                {"courseNumber":34,"courseTitle":"第34课","lessonFile":"lesson34","description":"大家的日语第34课"},
                {"courseNumber":35,"courseTitle":"第35课","lessonFile":"lesson35","description":"大家的日语第35课"},
                {"courseNumber":36,"courseTitle":"第36课","lessonFile":"lesson36","description":"大家的日语第36课"},
                {"courseNumber":37,"courseTitle":"第37课","lessonFile":"lesson37","description":"大家的日语第37课"},
                {"courseNumber":38,"courseTitle":"第38课","lessonFile":"lesson38","description":"大家的日语第38课"},
                {"courseNumber":39,"courseTitle":"第39课","lessonFile":"lesson39","description":"大家的日语第39课"},
                {"courseNumber":40,"courseTitle":"第40课","lessonFile":"lesson40","description":"大家的日语第40课"},
                {"courseNumber":41,"courseTitle":"第41课","lessonFile":"lesson41","description":"大家的日语第41课"},
                {"courseNumber":42,"courseTitle":"第42课","lessonFile":"lesson42","description":"大家的日语第42课"},
                {"courseNumber":43,"courseTitle":"第43课","lessonFile":"lesson43","description":"大家的日语第43课"},
                {"courseNumber":44,"courseTitle":"第44课","lessonFile":"lesson44","description":"大家的日语第44课"},
                {"courseNumber":45,"courseTitle":"第45课","lessonFile":"lesson45","description":"大家的日语第45课"},
                {"courseNumber":46,"courseTitle":"第46课","lessonFile":"lesson46","description":"大家的日语第46课"},
                {"courseNumber":47,"courseTitle":"第47课","lessonFile":"lesson47","description":"大家的日语第47课"},
                {"courseNumber":48,"courseTitle":"第48课","lessonFile":"lesson48","description":"大家的日语第48课"},
                {"courseNumber":49,"courseTitle":"第49课","lessonFile":"lesson49","description":"大家的日语第49课"},
                {"courseNumber":50,"courseTitle":"第50课","lessonFile":"lesson50","description":"大家的日语第50课"}
            ]
        },
         {
            "id": "everyones_japanese_intermediate",
            "name": "大日中级",
            "description": "大日中级",
            "cover_image": "https://free.picui.cn/free/2025/07/20/687bd4713099b.jpg",
            "volumes": [
                {"id":"volume1","name":"第一册","description":"1-12课","lessons":[1,2,3,4,5,6,7,8,9,10,11,12]}
            ],
            "courses": [
                {"courseNumber":1,"courseTitle":"第1课","lessonFile":"lesson1","description":"中级N3第1课"},
                {"courseNumber":2,"courseTitle":"第2课","lessonFile":"lesson2","description":"中级N3第2课"},
                {"courseNumber":3,"courseTitle":"第3课","lessonFile":"lesson3","description":"中级N3第3课"},
                {"courseNumber":4,"courseTitle":"第4课","lessonFile":"lesson4","description":"中级N3第4课"},
                {"courseNumber":5,"courseTitle":"第5课","lessonFile":"lesson5","description":"中级N3第5课"},
                {"courseNumber":6,"courseTitle":"第6课","lessonFile":"lesson6","description":"中级N3第6课"},
                {"courseNumber":7,"courseTitle":"第7课","lessonFile":"lesson7","description":"中级N3第7课"},
                {"courseNumber":8,"courseTitle":"第8课","lessonFile":"lesson8","description":"中级N3第8课"},
                {"courseNumber":9,"courseTitle":"第9课","lessonFile":"lesson9","description":"中级N3第9课"},
                {"courseNumber":10,"courseTitle":"第10课","lessonFile":"lesson10","description":"中级N3第10课"},
                {"courseNumber":11,"courseTitle":"第11课","lessonFile":"lesson11","description":"中级N3第11课"},
                {"courseNumber":12,"courseTitle":"第12课","lessonFile":"lesson12","description":"中级N3第12课"},
            ]
        },
        {
            "id": "liangs_class",
            "name": "梁老师初级",
            "description": "梁老师初级",
            "cover_image": "https://free.picui.cn/free/2025/07/20/687bd4712b75f.jpg",
            "lesson_files": [], // 将被动态填充
            "volumes": [
                {"id":"upper","name":"初级上","description":"5-17课","lessons":[5,6,7,8,9,10,11,12,13,14,15,16,17]},
                {"id":"lower","name":"初级下","description":"18-25课","lessons":[18,19,20,21,22,23,24,25]}
            ],
            "courses": [
                {"courseNumber":5,"courseTitle":"第5课","lessonFile":"lesson5","description":"初対面"},
                {"courseNumber":6,"courseTitle":"第6课","lessonFile":"lesson6","description":"Wi-Fiはありますか"},
                {"courseNumber":7,"courseTitle":"第7课","lessonFile":"lesson7","description":"スマホに写真がありますよ"},
                {"courseNumber":8,"courseTitle":"第8课","lessonFile":"lesson8","description":"Sサイズでお願いします"},
                {"courseNumber":9,"courseTitle":"第9课","lessonFile":"lesson9","description":"誕⽣⽇と性格"},
                {"courseNumber":10,"courseTitle":"第10课","lessonFile":"lesson10","description":"映画の約束"},
                {"courseNumber":11,"courseTitle":"第11课","lessonFile":"lesson11","description":"電気屋さんで"},
                {"courseNumber":12,"courseTitle":"第12课","lessonFile":"lesson12","description":"漫画ファン"},
                {"courseNumber":13,"courseTitle":"第13课","lessonFile":"lesson13","description":"忘れ物"},
                {"courseNumber":14,"courseTitle":"第14课","lessonFile":"lesson14","description":"勉強スケジュール"},
                {"courseNumber":15,"courseTitle":"第15课","lessonFile":"lesson15","description":"試験勉強"},
                {"courseNumber":16,"courseTitle":"第16课","lessonFile":"lesson16","description":"村上夏樹先生の講演会"},
                {"courseNumber":17,"courseTitle":"第17课","lessonFile":"lesson17","description":"アンケート"},
                {"courseNumber":18,"courseTitle":"第18课","lessonFile":"lesson18","description":"妹からアドバイスをもらいました"},
                {"courseNumber":19,"courseTitle":"第19课","lessonFile":"lesson19","description":"夏休の過ごし方"},
                {"courseNumber":20,"courseTitle":"第20课","lessonFile":"lesson20","description":"ネットで口コミ情報をチェック"},
                {"courseNumber":21,"courseTitle":"第21课","lessonFile":"lesson21","description":"返さなくてもいいんですか"},
                {"courseNumber":22,"courseTitle":"第22课","lessonFile":"lesson22","description":"チームワークが⼀番です"},
                {"courseNumber":23,"courseTitle":"第23课","lessonFile":"lesson23","description":"グループ作業"},
                {"courseNumber":24,"courseTitle":"第24课","lessonFile":"lesson24","description":"ランチ"},
                {"courseNumber":25,"courseTitle":"第25课","lessonFile":"lesson25","description":"日本の弁当文化"}
            ]
        },
        {
            "id": "liangs_intermediate",
            "name": "梁老师中级",
            "description": "梁老师中级",
            "cover_image": "https://free.picui.cn/free/2025/07/20/687bd4715697e.jpg",
            "lesson_files": [], // 将被动态填充
            "volumes": [
                {"id":"volume1","name":"第一册","description":"26-32课","lessons":[26,27,28,29,30,31,32]},
                {"id":"volume2","name":"第二册","description":"33-39课","lessons":[33,34,35,36,37,38,39]}
            ],
            "courses": [
                {"courseNumber":26,"courseTitle":"第26课","lessonFile":"lesson26","description":"オックスフォードへの日帰り旅"},
                {"courseNumber":27,"courseTitle":"第27课","lessonFile":"lesson27","description":"中村さんの日記"},
                {"courseNumber":28,"courseTitle":"第28课","lessonFile":"lesson28","description":"花粉症"},
                {"courseNumber":29,"courseTitle":"第29课","lessonFile":"lesson29","description":"花粉飛散予想"},
                {"courseNumber":30,"courseTitle":"第30课","lessonFile":"lesson30","description":"ネットアンケートの作り方"},
                {"courseNumber":31,"courseTitle":"第31课","lessonFile":"lesson31","description":"ネットアンケートの作り方（後編）"},
                {"courseNumber":32,"courseTitle":"第32课","lessonFile":"lesson32","description":"銀河鉄道の夜"},
                {"courseNumber":33,"courseTitle":"第33课","lessonFile":"lesson33","description":"宮崎駿と宮沢賢治"},
                {"courseNumber":34,"courseTitle":"第34课","lessonFile":"lesson34","description":"『嫌われる勇気』"},
                {"courseNumber":35,"courseTitle":"第35课","lessonFile":"lesson35","description":"経営戦略のセミナー"},
                {"courseNumber":36,"courseTitle":"第36课","lessonFile":"lesson36","description":"人生相談"},
                {"courseNumber":37,"courseTitle":"第37课","lessonFile":"lesson37","description":"創造性の高い人材"},
                {"courseNumber":38,"courseTitle":"第38课","lessonFile":"lesson38","description":"佐藤さんのブログ記事"},
                {"courseNumber":39,"courseTitle":"第39课","lessonFile":"lesson39","description":"ミーティングの初参加"}
            ]
        },
        {
            "id": "duolingguo",
            "name": "多邻国",
            "description": "多邻国日语词汇",
            "cover_image": "https://free.picui.cn/free/2025/07/20/687bd47111ec1.jpg",
            "lesson_files": [], // 将被动态填充
            "volumes": [
                {"id":"complete","name":"完整版","description":"1-5课","lessons":[1,2,3,4,5]}
            ],
            "courses": [
                {"courseNumber":1,"courseTitle":"第1课","lessonFile":"lesson1","description":"多邻国第1课"},
                {"courseNumber":2,"courseTitle":"第2课","lessonFile":"lesson2","description":"多邻国第2课"},
                {"courseNumber":3,"courseTitle":"第3课","lessonFile":"lesson3","description":"多邻国第3课"},
                {"courseNumber":4,"courseTitle":"第4课","lessonFile":"lesson4","description":"多邻国第4课"},
                {"courseNumber":5,"courseTitle":"第5课","lessonFile":"lesson5","description":"多邻国第5课"}
            ]
        }
    ]
};

// 动态生成 lesson_files 和 courses.lessonFile 的完整 URL
data.dictionaries.forEach(dict => {
    const dictId = dict.id;
    // 从 courses 数组生成 lesson_files 列表
    dict.lesson_files = dict.courses.map(course => {
        return `${BASE_URL}${dictId}/${course.lessonFile}.json`;
    });

    // 更新 courses 数组中每个 course 的 lessonFile 为完整的 URL
    dict.courses.forEach(course => {
        course.lessonFile = `${BASE_URL}${dictId}/${course.lessonFile}.json`;
    });
});

// 导出处理后的数据
module.exports = data;
