export interface DeweyNode {
    code: string;
    name: string;
    children?: DeweyNode[];
}

export const DEWEY_DATA: DeweyNode[] = [
    {
        "code": "000",
        "name": "Computer Science, Information & General Works",
        "children": [
            {
                "code": "000",
                "name": "Computer Science, Information & General Works",
                "children": []
            }
        ]
    },
    {
        "code": "100",
        "name": "Philosophy & Psychology",
        "children": [
            {
                "code": "100",
                "name": "Philosophy & Psychology",
                "children": [
                    {
                        "code": "105",
                        "name": "philosophy"
                    }
                ]
            },
            {
                "code": "110",
                "name": "METAPHYSICS",
                "children": [
                    {
                        "code": "111",
                        "name": "Ontology"
                    },
                    {
                        "code": "112",
                        "name": "Methodology"
                    },
                    {
                        "code": "113",
                        "name": "Cosmology"
                    }
                ]
            },
            {
                "code": "130",
                "name": "ANTHROPOLOGY",
                "children": [
                    {
                        "code": "131",
                        "name": "Mental physiology and hygiene"
                    },
                    {
                        "code": "132",
                        "name": "Mental derangements"
                    },
                    {
                        "code": "133",
                        "name": "Delusions, witchcraft, magic"
                    },
                    {
                        "code": "134",
                        "name": "Mesmerism"
                    },
                    {
                        "code": "135",
                        "name": "Sleep, dreams, somnambulism"
                    },
                    {
                        "code": "136",
                        "name": "Sexes"
                    },
                    {
                        "code": "137",
                        "name": "Temperaments"
                    },
                    {
                        "code": "138",
                        "name": "Physiognomy"
                    },
                    {
                        "code": "139",
                        "name": "Phrenology"
                    }
                ]
            },
            {
                "code": "140",
                "name": "SCHOOLS OF PSYCHOLOGY",
                "children": [
                    {
                        "code": "141",
                        "name": "Idealistic"
                    },
                    {
                        "code": "142",
                        "name": "Critical"
                    },
                    {
                        "code": "143",
                        "name": "Intuitive"
                    },
                    {
                        "code": "144",
                        "name": "Empirical"
                    },
                    {
                        "code": "145",
                        "name": "Sensational"
                    },
                    {
                        "code": "146",
                        "name": "Materialistic"
                    },
                    {
                        "code": "147",
                        "name": "Pantheistic"
                    },
                    {
                        "code": "148",
                        "name": "Eclectic"
                    }
                ]
            },
            {
                "code": "150",
                "name": "MENTAL FACULTIES",
                "children": [
                    {
                        "code": "151",
                        "name": "Intellect"
                    },
                    {
                        "code": "152",
                        "name": "Sense"
                    },
                    {
                        "code": "153",
                        "name": "Understanding"
                    },
                    {
                        "code": "154",
                        "name": "Memory"
                    },
                    {
                        "code": "155",
                        "name": "Reason"
                    },
                    {
                        "code": "156",
                        "name": "Imagination"
                    },
                    {
                        "code": "157",
                        "name": "Susceptibility"
                    },
                    {
                        "code": "158",
                        "name": "Instincts"
                    },
                    {
                        "code": "159",
                        "name": "Will"
                    }
                ]
            },
            {
                "code": "160",
                "name": "LOGIC",
                "children": [
                    {
                        "code": "161",
                        "name": "Inductive"
                    },
                    {
                        "code": "162",
                        "name": "Deductive"
                    },
                    {
                        "code": "163",
                        "name": "Assent"
                    }
                ]
            },
            {
                "code": "170",
                "name": "ETHICS",
                "children": [
                    {
                        "code": "172",
                        "name": "State"
                    },
                    {
                        "code": "173",
                        "name": "Family"
                    },
                    {
                        "code": "174",
                        "name": "Business"
                    },
                    {
                        "code": "176",
                        "name": "Sexual"
                    },
                    {
                        "code": "177",
                        "name": "Social"
                    },
                    {
                        "code": "178",
                        "name": "Temperance"
                    }
                ]
            },
            {
                "code": "180",
                "name": "ANCIENT PHILOSOPHIES",
                "children": [
                    {
                        "code": "182",
                        "name": "Early Greek"
                    },
                    {
                        "code": "183",
                        "name": "Sophistic and Socratic"
                    },
                    {
                        "code": "184",
                        "name": "Platonic"
                    },
                    {
                        "code": "185",
                        "name": "Aristotelian"
                    },
                    {
                        "code": "186",
                        "name": "Pyrrhonist and New Platonist"
                    },
                    {
                        "code": "187",
                        "name": "Epicurean"
                    },
                    {
                        "code": "188",
                        "name": "Stoic"
                    },
                    {
                        "code": "189",
                        "name": "Patristic"
                    }
                ]
            },
            {
                "code": "190",
                "name": "MODERN PHILOSOPHIES",
                "children": [
                    {
                        "code": "191",
                        "name": "Scotch and American"
                    },
                    {
                        "code": "197",
                        "name": "Arabian"
                    },
                    {
                        "code": "198",
                        "name": "Scholastic"
                    }
                ]
            }
        ]
    },
    {
        "code": "200",
        "name": "Theology",
        "children": [
            {
                "code": "200",
                "name": "Theology",
                "children": [
                    {
                        "code": "201",
                        "name": "religion"
                    },
                    {
                        "code": "205",
                        "name": "theology"
                    }
                ]
            },
            {
                "code": "210",
                "name": "NATURAL THEOLOGY",
                "children": [
                    {
                        "code": "211",
                        "name": "Theism and Atheism"
                    },
                    {
                        "code": "212",
                        "name": "Pantheism"
                    },
                    {
                        "code": "213",
                        "name": "Creation"
                    },
                    {
                        "code": "214",
                        "name": "Providence"
                    },
                    {
                        "code": "215",
                        "name": "Religion and science"
                    },
                    {
                        "code": "216",
                        "name": "Evil"
                    },
                    {
                        "code": "217",
                        "name": "Prayer"
                    },
                    {
                        "code": "218",
                        "name": "Future Life"
                    }
                ]
            },
            {
                "code": "220",
                "name": "BIBLE",
                "children": [
                    {
                        "code": "221",
                        "name": "Old Testament"
                    },
                    {
                        "code": "222",
                        "name": "Historical books"
                    },
                    {
                        "code": "223",
                        "name": "Poetical books"
                    },
                    {
                        "code": "224",
                        "name": "Prophetical books"
                    },
                    {
                        "code": "225",
                        "name": "New Testament"
                    },
                    {
                        "code": "226",
                        "name": "Gospels and Acts"
                    },
                    {
                        "code": "227",
                        "name": "Epistles"
                    },
                    {
                        "code": "228",
                        "name": "Apocalypse"
                    },
                    {
                        "code": "229",
                        "name": "Apocrypha"
                    }
                ]
            },
            {
                "code": "230",
                "name": "DOCTRINAL THEOLOGY",
                "children": [
                    {
                        "code": "231",
                        "name": "God"
                    },
                    {
                        "code": "232",
                        "name": "Christ"
                    },
                    {
                        "code": "233",
                        "name": "Man"
                    },
                    {
                        "code": "234",
                        "name": "Salvation"
                    },
                    {
                        "code": "235",
                        "name": "Angels"
                    },
                    {
                        "code": "236",
                        "name": "Death and resurrection"
                    },
                    {
                        "code": "237",
                        "name": "Future state"
                    },
                    {
                        "code": "238",
                        "name": "Inspiration"
                    },
                    {
                        "code": "239",
                        "name": "Apologetics"
                    }
                ]
            },
            {
                "code": "240",
                "name": "PRACTICAL AND DEVOTIONAL",
                "children": [
                    {
                        "code": "241",
                        "name": "Didactic"
                    },
                    {
                        "code": "242",
                        "name": "Meditative"
                    },
                    {
                        "code": "243",
                        "name": "Hortatory"
                    },
                    {
                        "code": "244",
                        "name": "Ritual"
                    },
                    {
                        "code": "245",
                        "name": "Hymnology"
                    },
                    {
                        "code": "246",
                        "name": "Public worship"
                    },
                    {
                        "code": "247",
                        "name": "Social worship"
                    },
                    {
                        "code": "248",
                        "name": "Private worship"
                    },
                    {
                        "code": "249",
                        "name": "Religious fiction and anecdote"
                    }
                ]
            },
            {
                "code": "250",
                "name": "HOMILETICAL AND PASTORAL",
                "children": [
                    {
                        "code": "251",
                        "name": "Homiletics"
                    },
                    {
                        "code": "252",
                        "name": "Sermons"
                    },
                    {
                        "code": "253",
                        "name": "Doctrinal"
                    },
                    {
                        "code": "255",
                        "name": "Religion and Science"
                    },
                    {
                        "code": "257",
                        "name": "Ordination"
                    },
                    {
                        "code": "258",
                        "name": "Expository"
                    },
                    {
                        "code": "259",
                        "name": "Commemorative"
                    }
                ]
            },
            {
                "code": "260",
                "name": "INSTITUTIONS AND MISSIONS",
                "children": [
                    {
                        "code": "262",
                        "name": "Ecclesiastical polity"
                    },
                    {
                        "code": "263",
                        "name": "Sabbath"
                    },
                    {
                        "code": "264",
                        "name": "Baptism"
                    },
                    {
                        "code": "265",
                        "name": "Lord's Supper"
                    },
                    {
                        "code": "266",
                        "name": "Missions"
                    },
                    {
                        "code": "267",
                        "name": "Foreign"
                    },
                    {
                        "code": "268",
                        "name": "Sunday schools"
                    },
                    {
                        "code": "269",
                        "name": "Revivals"
                    }
                ]
            },
            {
                "code": "270",
                "name": "ECCLESIASTICAL HISTORY",
                "children": [
                    {
                        "code": "271",
                        "name": "Religious orders"
                    },
                    {
                        "code": "272",
                        "name": "Persecutions"
                    },
                    {
                        "code": "273",
                        "name": "Doctrines"
                    },
                    {
                        "code": "277",
                        "name": "ecclesiastical history"
                    }
                ]
            },
            {
                "code": "280",
                "name": "CHRISTIAN SECTS",
                "children": [
                    {
                        "code": "281",
                        "name": "Oriental"
                    },
                    {
                        "code": "282",
                        "name": "Roman Catholic"
                    },
                    {
                        "code": "283",
                        "name": "English and Protestant Episcopal"
                    },
                    {
                        "code": "284",
                        "name": "Presbyterian"
                    },
                    {
                        "code": "285",
                        "name": "Congregational"
                    },
                    {
                        "code": "286",
                        "name": "Baptist"
                    },
                    {
                        "code": "287",
                        "name": "Methodist"
                    },
                    {
                        "code": "288",
                        "name": "Unitarian and Universalist"
                    },
                    {
                        "code": "289",
                        "name": "Other Christian sects"
                    }
                ]
            },
            {
                "code": "290",
                "name": "NON-CHRISTIAN RELIGIONS",
                "children": [
                    {
                        "code": "291",
                        "name": "Comparative mythology"
                    },
                    {
                        "code": "292",
                        "name": "Greek and Roman mythology"
                    },
                    {
                        "code": "293",
                        "name": "Norse mythology"
                    },
                    {
                        "code": "294",
                        "name": "Brahmanism and Buddhism"
                    },
                    {
                        "code": "295",
                        "name": "Parseeism"
                    },
                    {
                        "code": "296",
                        "name": "Judaism"
                    },
                    {
                        "code": "297",
                        "name": "Mohammedanism"
                    },
                    {
                        "code": "298",
                        "name": "Mormonism"
                    }
                ]
            }
        ]
    },
    {
        "code": "300",
        "name": "Sociology",
        "children": [
            {
                "code": "300",
                "name": "Sociology",
                "children": [
                    {
                        "code": "301",
                        "name": "sociology"
                    }
                ]
            },
            {
                "code": "310",
                "name": "STATISTICS",
                "children": [
                    {
                        "code": "311",
                        "name": "Methods"
                    },
                    {
                        "code": "312",
                        "name": "Progress of population"
                    },
                    {
                        "code": "313",
                        "name": "Progress of civilization"
                    },
                    {
                        "code": "317",
                        "name": "statistics"
                    }
                ]
            },
            {
                "code": "320",
                "name": "POLITICAL SCIENCE",
                "children": [
                    {
                        "code": "321",
                        "name": "Patriarchal Institutions"
                    },
                    {
                        "code": "322",
                        "name": "Feudal Institutions"
                    },
                    {
                        "code": "323",
                        "name": "Monarchic Institutions"
                    },
                    {
                        "code": "324",
                        "name": "Republican Institutions"
                    },
                    {
                        "code": "325",
                        "name": "Colonies and Emigration"
                    },
                    {
                        "code": "326",
                        "name": "Slavery"
                    },
                    {
                        "code": "327",
                        "name": "Foreign and Domestic relations"
                    },
                    {
                        "code": "328",
                        "name": "Legislative annals"
                    },
                    {
                        "code": "329",
                        "name": "Political essays and speeches"
                    }
                ]
            },
            {
                "code": "330",
                "name": "POLITICAL ECONOMY",
                "children": [
                    {
                        "code": "331",
                        "name": "Capital and labor"
                    },
                    {
                        "code": "332",
                        "name": "Banks and money"
                    },
                    {
                        "code": "333",
                        "name": "Stocks, rents, and income"
                    },
                    {
                        "code": "334",
                        "name": "Credit and interest"
                    },
                    {
                        "code": "335",
                        "name": "Communism"
                    },
                    {
                        "code": "336",
                        "name": "Public funds and taxation"
                    },
                    {
                        "code": "337",
                        "name": "Protection and free trade"
                    },
                    {
                        "code": "338",
                        "name": "Production"
                    },
                    {
                        "code": "339",
                        "name": "Pauperism"
                    }
                ]
            },
            {
                "code": "340",
                "name": "LAW",
                "children": [
                    {
                        "code": "341",
                        "name": "International"
                    },
                    {
                        "code": "342",
                        "name": "Constitutional and administrative"
                    },
                    {
                        "code": "343",
                        "name": "Statute and common"
                    },
                    {
                        "code": "344",
                        "name": "Equity"
                    },
                    {
                        "code": "345",
                        "name": "Criminal"
                    },
                    {
                        "code": "346",
                        "name": "Maritime"
                    },
                    {
                        "code": "347",
                        "name": "Martial"
                    },
                    {
                        "code": "348",
                        "name": "Civil and Canon"
                    },
                    {
                        "code": "349",
                        "name": "Evidence and Forms of practice"
                    }
                ]
            },
            {
                "code": "350",
                "name": "ADMINISTRATION",
                "children": [
                    {
                        "code": "351",
                        "name": "Civil Service"
                    },
                    {
                        "code": "352",
                        "name": "Treasury"
                    },
                    {
                        "code": "353",
                        "name": "Interior"
                    },
                    {
                        "code": "354",
                        "name": "Police"
                    },
                    {
                        "code": "355",
                        "name": "Army"
                    },
                    {
                        "code": "356",
                        "name": "Infantry"
                    },
                    {
                        "code": "357",
                        "name": "Cavalry"
                    },
                    {
                        "code": "358",
                        "name": "Artillery"
                    },
                    {
                        "code": "359",
                        "name": "Navy"
                    }
                ]
            },
            {
                "code": "360",
                "name": "ASSOCIATIONS AND INSTITUTIONS",
                "children": [
                    {
                        "code": "361",
                        "name": "Charitable"
                    },
                    {
                        "code": "363",
                        "name": "Political"
                    },
                    {
                        "code": "364",
                        "name": "Reformatory and Sanitary"
                    },
                    {
                        "code": "365",
                        "name": "Prisons"
                    },
                    {
                        "code": "366",
                        "name": "Secret Societies"
                    },
                    {
                        "code": "367",
                        "name": "Trades Unions"
                    },
                    {
                        "code": "368",
                        "name": "Insurance"
                    }
                ]
            },
            {
                "code": "370",
                "name": "EDUCATION",
                "children": [
                    {
                        "code": "371",
                        "name": "Teachers, methods, and discipline"
                    },
                    {
                        "code": "372",
                        "name": "Elementary"
                    },
                    {
                        "code": "373",
                        "name": "Higher"
                    },
                    {
                        "code": "374",
                        "name": "Self-education"
                    },
                    {
                        "code": "375",
                        "name": "Classical and real"
                    },
                    {
                        "code": "376",
                        "name": "Female"
                    },
                    {
                        "code": "377",
                        "name": "Religious and secular"
                    },
                    {
                        "code": "378",
                        "name": "Schools and Colleges"
                    },
                    {
                        "code": "379",
                        "name": "Reports"
                    }
                ]
            },
            {
                "code": "380",
                "name": "COMMERCE AND COMMUNICATION",
                "children": [
                    {
                        "code": "381",
                        "name": "Domestic trade"
                    },
                    {
                        "code": "382",
                        "name": "Foreign trade"
                    },
                    {
                        "code": "383",
                        "name": "Post office"
                    },
                    {
                        "code": "384",
                        "name": "Telegraph"
                    },
                    {
                        "code": "385",
                        "name": "Railroad and express"
                    },
                    {
                        "code": "386",
                        "name": "Canal transportation"
                    },
                    {
                        "code": "387",
                        "name": "River and ocean transportation"
                    },
                    {
                        "code": "388",
                        "name": "City transit"
                    },
                    {
                        "code": "389",
                        "name": "Weights and measures"
                    }
                ]
            },
            {
                "code": "390",
                "name": "CUSTOMS AND COSTUMES",
                "children": [
                    {
                        "code": "397",
                        "name": "customs and costumes"
                    }
                ]
            }
        ]
    },
    {
        "code": "400",
        "name": "Philology",
        "children": [
            {
                "code": "400",
                "name": "Philology",
                "children": [
                    {
                        "code": "401",
                        "name": "language"
                    },
                    {
                        "code": "405",
                        "name": "philology"
                    },
                    {
                        "code": "408",
                        "name": "Universal Language"
                    }
                ]
            },
            {
                "code": "410",
                "name": "COMPARATIVE",
                "children": [
                    {
                        "code": "413",
                        "name": "comparative"
                    },
                    {
                        "code": "414",
                        "name": "Phonology"
                    },
                    {
                        "code": "417",
                        "name": "Inscriptions"
                    },
                    {
                        "code": "419",
                        "name": "Hieroglyphics"
                    }
                ]
            }
        ]
    },
    {
        "code": "500",
        "name": "Natural Science",
        "children": [
            {
                "code": "500",
                "name": "Natural Science",
                "children": [
                    {
                        "code": "501",
                        "name": "science"
                    },
                    {
                        "code": "505",
                        "name": "natural science"
                    },
                    {
                        "code": "508",
                        "name": "Travels"
                    },
                    {
                        "code": "509",
                        "name": "natural sciences"
                    }
                ]
            },
            {
                "code": "510",
                "name": "MATHEMATICS",
                "children": [
                    {
                        "code": "511",
                        "name": "Arithmetic"
                    },
                    {
                        "code": "512",
                        "name": "Algebra"
                    },
                    {
                        "code": "513",
                        "name": "Geometry"
                    },
                    {
                        "code": "514",
                        "name": "Trigonometry"
                    },
                    {
                        "code": "515",
                        "name": "Conic sections"
                    },
                    {
                        "code": "516",
                        "name": "Analytical geometry"
                    },
                    {
                        "code": "517",
                        "name": "Calculus"
                    },
                    {
                        "code": "518",
                        "name": "Quaternions"
                    },
                    {
                        "code": "519",
                        "name": "Probabilities"
                    }
                ]
            },
            {
                "code": "520",
                "name": "ASTRONOMY",
                "children": [
                    {
                        "code": "522",
                        "name": "Practical"
                    },
                    {
                        "code": "523",
                        "name": "Descriptive"
                    },
                    {
                        "code": "524",
                        "name": "Maps"
                    },
                    {
                        "code": "525",
                        "name": "Observations"
                    },
                    {
                        "code": "526",
                        "name": "Figure of the earth"
                    },
                    {
                        "code": "527",
                        "name": "Navigation"
                    },
                    {
                        "code": "528",
                        "name": "Almanacs"
                    },
                    {
                        "code": "529",
                        "name": "Chronology"
                    }
                ]
            },
            {
                "code": "530",
                "name": "PHYSICS",
                "children": [
                    {
                        "code": "531",
                        "name": "Mechanics"
                    },
                    {
                        "code": "532",
                        "name": "Hydrostatics"
                    },
                    {
                        "code": "533",
                        "name": "Pneumatics"
                    },
                    {
                        "code": "534",
                        "name": "Acoustics"
                    },
                    {
                        "code": "535",
                        "name": "Optics"
                    },
                    {
                        "code": "536",
                        "name": "Heat"
                    },
                    {
                        "code": "537",
                        "name": "Electricity"
                    },
                    {
                        "code": "538",
                        "name": "Magnetism"
                    },
                    {
                        "code": "539",
                        "name": "Molecular physics"
                    }
                ]
            },
            {
                "code": "540",
                "name": "CHEMISTRY",
                "children": [
                    {
                        "code": "541",
                        "name": "Theoretical"
                    },
                    {
                        "code": "542",
                        "name": "Experimental"
                    },
                    {
                        "code": "543",
                        "name": "Analysis"
                    },
                    {
                        "code": "544",
                        "name": "Qualitative"
                    },
                    {
                        "code": "545",
                        "name": "Quantitative"
                    },
                    {
                        "code": "546",
                        "name": "Inorganic"
                    },
                    {
                        "code": "547",
                        "name": "Organic"
                    },
                    {
                        "code": "548",
                        "name": "Crystallography"
                    },
                    {
                        "code": "549",
                        "name": "Mineralogy"
                    }
                ]
            },
            {
                "code": "550",
                "name": "GEOLOGY",
                "children": [
                    {
                        "code": "551",
                        "name": "Physical Geography, Meteorology"
                    },
                    {
                        "code": "552",
                        "name": "Lithology"
                    },
                    {
                        "code": "553",
                        "name": "Dynamical geology"
                    },
                    {
                        "code": "557",
                        "name": "geology"
                    }
                ]
            },
            {
                "code": "560",
                "name": "PALEONTOLOGY",
                "children": [
                    {
                        "code": "561",
                        "name": "Plants"
                    },
                    {
                        "code": "563",
                        "name": "paleontology"
                    }
                ]
            },
            {
                "code": "570",
                "name": "BIOLOGY",
                "children": [
                    {
                        "code": "571",
                        "name": "Prehistoric Arch\u00e6ology"
                    },
                    {
                        "code": "572",
                        "name": "Ethnology"
                    },
                    {
                        "code": "573",
                        "name": "Natural History of Man"
                    },
                    {
                        "code": "574",
                        "name": "Homologies"
                    },
                    {
                        "code": "575",
                        "name": "Evolution"
                    },
                    {
                        "code": "576",
                        "name": "Embryology"
                    },
                    {
                        "code": "577",
                        "name": "Spontaneous generation"
                    },
                    {
                        "code": "578",
                        "name": "Microscopy"
                    },
                    {
                        "code": "579",
                        "name": "Collectors' Manuals"
                    }
                ]
            },
            {
                "code": "580",
                "name": "BOTANY",
                "children": [
                    {
                        "code": "581",
                        "name": "Physiological"
                    },
                    {
                        "code": "582",
                        "name": "Systematic"
                    },
                    {
                        "code": "583",
                        "name": "Ornamental"
                    },
                    {
                        "code": "587",
                        "name": "botany"
                    },
                    {
                        "code": "589",
                        "name": "Oceanica"
                    }
                ]
            },
            {
                "code": "590",
                "name": "ZOOLOGY",
                "children": [
                    {
                        "code": "591",
                        "name": "Comparative Anatomy"
                    },
                    {
                        "code": "592",
                        "name": "Invertebrates"
                    },
                    {
                        "code": "593",
                        "name": "Protozoa and Radiates"
                    },
                    {
                        "code": "594",
                        "name": "Mollusca"
                    },
                    {
                        "code": "595",
                        "name": "Articulates"
                    },
                    {
                        "code": "596",
                        "name": "Vertebrates"
                    },
                    {
                        "code": "597",
                        "name": "Fishes"
                    },
                    {
                        "code": "598",
                        "name": "Reptiles and Birds"
                    },
                    {
                        "code": "599",
                        "name": "Mammals"
                    }
                ]
            }
        ]
    },
    {
        "code": "600",
        "name": "Useful Arts",
        "children": [
            {
                "code": "600",
                "name": "Useful Arts",
                "children": [
                    {
                        "code": "601",
                        "name": "useful arts"
                    },
                    {
                        "code": "608",
                        "name": "Patents"
                    }
                ]
            },
            {
                "code": "610",
                "name": "MEDICINE",
                "children": [
                    {
                        "code": "611",
                        "name": "Anatomy"
                    },
                    {
                        "code": "612",
                        "name": "Physiology"
                    },
                    {
                        "code": "613",
                        "name": "Hygiene"
                    },
                    {
                        "code": "614",
                        "name": "Public health"
                    },
                    {
                        "code": "615",
                        "name": "Materia medica and therapeutics"
                    },
                    {
                        "code": "616",
                        "name": "Pathology, theory and practice"
                    },
                    {
                        "code": "617",
                        "name": "Surgery and dentistry"
                    },
                    {
                        "code": "618",
                        "name": "Obstetrics and sexual science"
                    },
                    {
                        "code": "619",
                        "name": "Veterinary medicine"
                    }
                ]
            },
            {
                "code": "620",
                "name": "ENGINEERING",
                "children": [
                    {
                        "code": "621",
                        "name": "Mechanical"
                    },
                    {
                        "code": "622",
                        "name": "Topographical"
                    },
                    {
                        "code": "623",
                        "name": "engineering"
                    },
                    {
                        "code": "624",
                        "name": "Bridge"
                    },
                    {
                        "code": "625",
                        "name": "Road and railroad"
                    },
                    {
                        "code": "626",
                        "name": "Canal"
                    },
                    {
                        "code": "627",
                        "name": "Harbor"
                    },
                    {
                        "code": "628",
                        "name": "Hydraulic and mining"
                    },
                    {
                        "code": "629",
                        "name": "Instruments and field books"
                    }
                ]
            },
            {
                "code": "630",
                "name": "AGRICULTURE",
                "children": [
                    {
                        "code": "631",
                        "name": "Soil and preparation"
                    },
                    {
                        "code": "632",
                        "name": "Pests and hindrances"
                    },
                    {
                        "code": "633",
                        "name": "Productions of the soil"
                    },
                    {
                        "code": "634",
                        "name": "Fruits"
                    },
                    {
                        "code": "635",
                        "name": "Garden"
                    },
                    {
                        "code": "636",
                        "name": "Domestic animals"
                    },
                    {
                        "code": "637",
                        "name": "Dairy"
                    },
                    {
                        "code": "638",
                        "name": "Bees and silkworm"
                    },
                    {
                        "code": "639",
                        "name": "Fishing, trapping"
                    }
                ]
            },
            {
                "code": "640",
                "name": "DOMESTIC ECONOMY",
                "children": [
                    {
                        "code": "641",
                        "name": "Cookery"
                    },
                    {
                        "code": "642",
                        "name": "Confectionery"
                    },
                    {
                        "code": "643",
                        "name": "Food and dining"
                    },
                    {
                        "code": "644",
                        "name": "Fuel and lights"
                    },
                    {
                        "code": "645",
                        "name": "Furniture"
                    },
                    {
                        "code": "646",
                        "name": "Clothing and toilet"
                    },
                    {
                        "code": "647",
                        "name": "Servants"
                    },
                    {
                        "code": "648",
                        "name": "Laundry"
                    },
                    {
                        "code": "649",
                        "name": "Nursery and sick-room"
                    }
                ]
            },
            {
                "code": "650",
                "name": "COMMUNICATION AND COMMERCE",
                "children": [
                    {
                        "code": "651",
                        "name": "Writing"
                    },
                    {
                        "code": "652",
                        "name": "Penmanship"
                    },
                    {
                        "code": "653",
                        "name": "Short hand"
                    },
                    {
                        "code": "654",
                        "name": "Telegraphy"
                    },
                    {
                        "code": "655",
                        "name": "Printing"
                    },
                    {
                        "code": "656",
                        "name": "Navigation and transportation"
                    },
                    {
                        "code": "657",
                        "name": "Book-keeping"
                    },
                    {
                        "code": "658",
                        "name": "Business manuals"
                    }
                ]
            },
            {
                "code": "660",
                "name": "CHEMICAL TECHNOLOGY",
                "children": [
                    {
                        "code": "661",
                        "name": "Chemicals"
                    },
                    {
                        "code": "662",
                        "name": "Pyrotechnics"
                    },
                    {
                        "code": "663",
                        "name": "Wines, liquors, and ales"
                    },
                    {
                        "code": "664",
                        "name": "Sugar, salt, starch, etc"
                    },
                    {
                        "code": "665",
                        "name": "Gas"
                    },
                    {
                        "code": "666",
                        "name": "Glass"
                    },
                    {
                        "code": "667",
                        "name": "Dyeing and bleaching"
                    },
                    {
                        "code": "668",
                        "name": "Assaying"
                    },
                    {
                        "code": "669",
                        "name": "Metallurgy"
                    }
                ]
            },
            {
                "code": "670",
                "name": "MANUFACTURES",
                "children": [
                    {
                        "code": "671",
                        "name": "Metals"
                    },
                    {
                        "code": "672",
                        "name": "Iron"
                    },
                    {
                        "code": "673",
                        "name": "Marble, stone, and brick"
                    },
                    {
                        "code": "675",
                        "name": "Leather and rubber"
                    },
                    {
                        "code": "676",
                        "name": "Paper"
                    },
                    {
                        "code": "677",
                        "name": "Textile fabrics"
                    },
                    {
                        "code": "678",
                        "name": "Cotton"
                    }
                ]
            },
            {
                "code": "680",
                "name": "MECHANIC TRADES",
                "children": [
                    {
                        "code": "681",
                        "name": "Watch and instrument-making"
                    },
                    {
                        "code": "682",
                        "name": "Blacksmithing"
                    },
                    {
                        "code": "683",
                        "name": "Lock and gun-making"
                    },
                    {
                        "code": "684",
                        "name": "Carriage and cabinet-making"
                    },
                    {
                        "code": "685",
                        "name": "Saddlery and shoe-making"
                    },
                    {
                        "code": "686",
                        "name": "Book-binding"
                    },
                    {
                        "code": "687",
                        "name": "Clothes-making"
                    }
                ]
            },
            {
                "code": "690",
                "name": "BUILDING",
                "children": [
                    {
                        "code": "692",
                        "name": "Plans and specifications"
                    },
                    {
                        "code": "693",
                        "name": "Masonry"
                    },
                    {
                        "code": "694",
                        "name": "Carpentry"
                    },
                    {
                        "code": "695",
                        "name": "Slating and tiling"
                    },
                    {
                        "code": "696",
                        "name": "Plumbing"
                    },
                    {
                        "code": "697",
                        "name": "Warming and ventilation"
                    },
                    {
                        "code": "698",
                        "name": "Painting, glazing, and paper-hanging"
                    },
                    {
                        "code": "699",
                        "name": "Car and Ship-building"
                    }
                ]
            }
        ]
    },
    {
        "code": "700",
        "name": "Fine Arts",
        "children": [
            {
                "code": "700",
                "name": "Fine Arts",
                "children": [
                    {
                        "code": "701",
                        "name": "of art"
                    },
                    {
                        "code": "703",
                        "name": "fine art"
                    },
                    {
                        "code": "705",
                        "name": "fine arts"
                    },
                    {
                        "code": "708",
                        "name": "Galleries"
                    }
                ]
            },
            {
                "code": "710",
                "name": "LANDSCAPE GARDENING",
                "children": [
                    {
                        "code": "711",
                        "name": "Parks"
                    },
                    {
                        "code": "712",
                        "name": "Private grounds"
                    },
                    {
                        "code": "713",
                        "name": "Walks and drives"
                    },
                    {
                        "code": "714",
                        "name": "Water"
                    },
                    {
                        "code": "715",
                        "name": "Trees and hedges"
                    },
                    {
                        "code": "716",
                        "name": "landscape gardening"
                    },
                    {
                        "code": "717",
                        "name": "Arbors"
                    },
                    {
                        "code": "718",
                        "name": "Monuments"
                    },
                    {
                        "code": "719",
                        "name": "Cemeteries"
                    }
                ]
            },
            {
                "code": "720",
                "name": "ARCHITECTURE",
                "children": [
                    {
                        "code": "721",
                        "name": "Architectural construction"
                    },
                    {
                        "code": "722",
                        "name": "Ancient and Oriental"
                    },
                    {
                        "code": "725",
                        "name": "Public buildings"
                    },
                    {
                        "code": "727",
                        "name": "School"
                    },
                    {
                        "code": "728",
                        "name": "Domestic and rural"
                    },
                    {
                        "code": "729",
                        "name": "Of special countries"
                    }
                ]
            },
            {
                "code": "730",
                "name": "SCULPTURE",
                "children": [
                    {
                        "code": "733",
                        "name": "Greek and Roman"
                    },
                    {
                        "code": "736",
                        "name": "Carving"
                    },
                    {
                        "code": "737",
                        "name": "Numismatics"
                    },
                    {
                        "code": "738",
                        "name": "Pottery and bronzes"
                    },
                    {
                        "code": "739",
                        "name": "sculpture, etc"
                    }
                ]
            },
            {
                "code": "740",
                "name": "DRAWING AND DESIGN",
                "children": [
                    {
                        "code": "741",
                        "name": "Free-hand"
                    },
                    {
                        "code": "742",
                        "name": "Perspective"
                    },
                    {
                        "code": "743",
                        "name": "Art anatomy"
                    },
                    {
                        "code": "744",
                        "name": "Mathematical drawing"
                    },
                    {
                        "code": "745",
                        "name": "Ornamental design"
                    },
                    {
                        "code": "747",
                        "name": "Medieval"
                    },
                    {
                        "code": "749",
                        "name": "drawing and design"
                    }
                ]
            },
            {
                "code": "750",
                "name": "PAINTING",
                "children": [
                    {
                        "code": "751",
                        "name": "Materials and methods"
                    },
                    {
                        "code": "752",
                        "name": "Color"
                    },
                    {
                        "code": "753",
                        "name": "Flemish and Dutch Schools"
                    },
                    {
                        "code": "756",
                        "name": "Other schools"
                    },
                    {
                        "code": "759",
                        "name": "painting"
                    }
                ]
            },
            {
                "code": "760",
                "name": "ENGRAVING",
                "children": [
                    {
                        "code": "761",
                        "name": "Wood"
                    },
                    {
                        "code": "762",
                        "name": "Steel and Copper"
                    },
                    {
                        "code": "763",
                        "name": "Lithography"
                    },
                    {
                        "code": "764",
                        "name": "Chromolithography"
                    },
                    {
                        "code": "765",
                        "name": "Line and Stipple"
                    },
                    {
                        "code": "766",
                        "name": "Mezzotint and Aquatint"
                    },
                    {
                        "code": "767",
                        "name": "Etching"
                    },
                    {
                        "code": "768",
                        "name": "Bank Note and Machine"
                    },
                    {
                        "code": "769",
                        "name": "engraving"
                    }
                ]
            },
            {
                "code": "770",
                "name": "PHOTOGRAPHY",
                "children": [
                    {
                        "code": "771",
                        "name": "Materials"
                    },
                    {
                        "code": "772",
                        "name": "Ambrotype and Daguerreotype"
                    },
                    {
                        "code": "773",
                        "name": "Photograph"
                    },
                    {
                        "code": "774",
                        "name": "Heliotype, Albertype, etc"
                    },
                    {
                        "code": "775",
                        "name": "Photolithography"
                    },
                    {
                        "code": "776",
                        "name": "Stereoscopic"
                    },
                    {
                        "code": "777",
                        "name": "Portrait"
                    },
                    {
                        "code": "778",
                        "name": "Landscape"
                    },
                    {
                        "code": "779",
                        "name": "Collections"
                    }
                ]
            },
            {
                "code": "780",
                "name": "MUSIC",
                "children": [
                    {
                        "code": "781",
                        "name": "Theory"
                    },
                    {
                        "code": "783",
                        "name": "Church"
                    },
                    {
                        "code": "784",
                        "name": "Vocal"
                    },
                    {
                        "code": "785",
                        "name": "Instrumental"
                    },
                    {
                        "code": "786",
                        "name": "Piano and Organ"
                    },
                    {
                        "code": "787",
                        "name": "Stringed instruments"
                    },
                    {
                        "code": "788",
                        "name": "Wind instruments"
                    },
                    {
                        "code": "789",
                        "name": "Associations and institutions"
                    }
                ]
            },
            {
                "code": "790",
                "name": "AMUSEMENTS",
                "children": [
                    {
                        "code": "791",
                        "name": "Entertainments"
                    },
                    {
                        "code": "792",
                        "name": "Theatre"
                    },
                    {
                        "code": "793",
                        "name": "In-door amusements"
                    },
                    {
                        "code": "794",
                        "name": "Chess"
                    },
                    {
                        "code": "795",
                        "name": "Other games"
                    },
                    {
                        "code": "796",
                        "name": "Out-door sports"
                    },
                    {
                        "code": "797",
                        "name": "Boating and ball"
                    },
                    {
                        "code": "798",
                        "name": "Horsemanship and racing"
                    },
                    {
                        "code": "799",
                        "name": "Fishing, hunting, shooting"
                    }
                ]
            }
        ]
    },
    {
        "code": "800",
        "name": "Literature",
        "children": [
            {
                "code": "800",
                "name": "Literature",
                "children": [
                    {
                        "code": "801",
                        "name": "literature"
                    },
                    {
                        "code": "802",
                        "name": "Compends"
                    }
                ]
            },
            {
                "code": "810",
                "name": "TREATISES AND COLLECTIONS",
                "children": [
                    {
                        "code": "811",
                        "name": "Poetry"
                    },
                    {
                        "code": "812",
                        "name": "Drama"
                    },
                    {
                        "code": "813",
                        "name": "Romance"
                    },
                    {
                        "code": "815",
                        "name": "Rhetoric and oratory"
                    },
                    {
                        "code": "816",
                        "name": "Letters"
                    },
                    {
                        "code": "817",
                        "name": "Satire"
                    },
                    {
                        "code": "818",
                        "name": "Humor"
                    },
                    {
                        "code": "819",
                        "name": "Miscellany"
                    }
                ]
            },
            {
                "code": "820",
                "name": "English Literature",
                "children": [
                    {
                        "code": "821",
                        "name": "English Poetry"
                    },
                    {
                        "code": "822",
                        "name": "English Drama"
                    },
                    {
                        "code": "823",
                        "name": "English Romance"
                    },
                    {
                        "code": "824",
                        "name": "English Essays"
                    },
                    {
                        "code": "825",
                        "name": "English Oratory"
                    },
                    {
                        "code": "826",
                        "name": "English Letters"
                    },
                    {
                        "code": "827",
                        "name": "English Satire"
                    },
                    {
                        "code": "828",
                        "name": "English Humor"
                    },
                    {
                        "code": "829",
                        "name": "English Miscellany"
                    }
                ]
            },
            {
                "code": "830",
                "name": "German Literature",
                "children": [
                    {
                        "code": "831",
                        "name": "German Poetry"
                    },
                    {
                        "code": "832",
                        "name": "German Drama"
                    },
                    {
                        "code": "833",
                        "name": "German Romance"
                    },
                    {
                        "code": "834",
                        "name": "German Essays"
                    },
                    {
                        "code": "835",
                        "name": "German Oratory"
                    },
                    {
                        "code": "836",
                        "name": "German Letters"
                    },
                    {
                        "code": "837",
                        "name": "German Satire"
                    },
                    {
                        "code": "838",
                        "name": "German Humor"
                    },
                    {
                        "code": "839",
                        "name": "German Miscellany"
                    }
                ]
            },
            {
                "code": "840",
                "name": "French Literature",
                "children": [
                    {
                        "code": "841",
                        "name": "French Poetry"
                    },
                    {
                        "code": "842",
                        "name": "French Drama"
                    },
                    {
                        "code": "843",
                        "name": "French Romance"
                    },
                    {
                        "code": "844",
                        "name": "French Essays"
                    },
                    {
                        "code": "845",
                        "name": "French Oratory"
                    },
                    {
                        "code": "846",
                        "name": "French Letters"
                    },
                    {
                        "code": "847",
                        "name": "French Satire"
                    },
                    {
                        "code": "848",
                        "name": "French Humor"
                    },
                    {
                        "code": "849",
                        "name": "French Miscellany"
                    }
                ]
            },
            {
                "code": "850",
                "name": "Italian Literature",
                "children": [
                    {
                        "code": "851",
                        "name": "Italian Poetry"
                    },
                    {
                        "code": "852",
                        "name": "Italian Drama"
                    },
                    {
                        "code": "853",
                        "name": "Italian Romance"
                    },
                    {
                        "code": "854",
                        "name": "Italian Essays"
                    },
                    {
                        "code": "855",
                        "name": "Italian Oratory"
                    },
                    {
                        "code": "856",
                        "name": "Italian Letters"
                    },
                    {
                        "code": "857",
                        "name": "Italian Satire"
                    },
                    {
                        "code": "858",
                        "name": "Italian Humor"
                    },
                    {
                        "code": "859",
                        "name": "Italian Miscellany"
                    }
                ]
            },
            {
                "code": "860",
                "name": "Spanish Literature",
                "children": [
                    {
                        "code": "861",
                        "name": "Spanish Poetry"
                    },
                    {
                        "code": "862",
                        "name": "Spanish Drama"
                    },
                    {
                        "code": "863",
                        "name": "Spanish Romance"
                    },
                    {
                        "code": "864",
                        "name": "Spanish Essays"
                    },
                    {
                        "code": "865",
                        "name": "Spanish Oratory"
                    },
                    {
                        "code": "866",
                        "name": "Spanish Letters"
                    },
                    {
                        "code": "867",
                        "name": "Spanish Satire"
                    },
                    {
                        "code": "868",
                        "name": "Spanish Humor"
                    },
                    {
                        "code": "869",
                        "name": "Spanish Miscellany"
                    }
                ]
            },
            {
                "code": "870",
                "name": "Latin Literature",
                "children": [
                    {
                        "code": "871",
                        "name": "Latin Poetry"
                    },
                    {
                        "code": "875",
                        "name": "Latin Oratory"
                    },
                    {
                        "code": "876",
                        "name": "Latin Letters"
                    },
                    {
                        "code": "877",
                        "name": "Latin Satire"
                    },
                    {
                        "code": "878",
                        "name": "Latin Philosophy"
                    },
                    {
                        "code": "879",
                        "name": "Latin History"
                    }
                ]
            },
            {
                "code": "880",
                "name": "Greek Literature",
                "children": [
                    {
                        "code": "881",
                        "name": "Greek Poetry"
                    },
                    {
                        "code": "882",
                        "name": "Dramatic"
                    },
                    {
                        "code": "883",
                        "name": "Epic"
                    },
                    {
                        "code": "884",
                        "name": "Lyric"
                    },
                    {
                        "code": "885",
                        "name": "Greek Oratory"
                    },
                    {
                        "code": "886",
                        "name": "Greek Letters"
                    },
                    {
                        "code": "887",
                        "name": "Greek Humor"
                    },
                    {
                        "code": "888",
                        "name": "Greek Philosophy"
                    },
                    {
                        "code": "889",
                        "name": "Greek History"
                    }
                ]
            },
            {
                "code": "890",
                "name": "OTHER LANGUAGES",
                "children": [
                    {
                        "code": "893",
                        "name": "Semitic"
                    },
                    {
                        "code": "895",
                        "name": "Iranian"
                    },
                    {
                        "code": "897",
                        "name": "Slavic"
                    },
                    {
                        "code": "898",
                        "name": "Scandinavian"
                    }
                ]
            }
        ]
    },
    {
        "code": "900",
        "name": "History",
        "children": [
            {
                "code": "900",
                "name": "History",
                "children": [
                    {
                        "code": "901",
                        "name": "philosophy of"
                    },
                    {
                        "code": "902",
                        "name": "Compends, chronology"
                    },
                    {
                        "code": "903",
                        "name": "Dictionaries"
                    },
                    {
                        "code": "904",
                        "name": "Essays"
                    },
                    {
                        "code": "905",
                        "name": "Periodicals"
                    },
                    {
                        "code": "906",
                        "name": "Societies"
                    },
                    {
                        "code": "907",
                        "name": "Education"
                    },
                    {
                        "code": "908",
                        "name": "Charts"
                    },
                    {
                        "code": "909",
                        "name": "Universal Histories"
                    }
                ]
            },
            {
                "code": "910",
                "name": "GEOGRAPHY AND DESCRIPTION",
                "children": [
                    {
                        "code": "911",
                        "name": "Historical"
                    },
                    {
                        "code": "912",
                        "name": "Ancient"
                    },
                    {
                        "code": "913",
                        "name": "Modern"
                    },
                    {
                        "code": "917",
                        "name": "description"
                    },
                    {
                        "code": "918",
                        "name": "escription"
                    }
                ]
            },
            {
                "code": "920",
                "name": "BIOGRAPHY",
                "children": [
                    {
                        "code": "921",
                        "name": "Of philosophy"
                    },
                    {
                        "code": "922",
                        "name": "Of theology"
                    },
                    {
                        "code": "923",
                        "name": "Of sociology"
                    },
                    {
                        "code": "924",
                        "name": "Of philology"
                    },
                    {
                        "code": "925",
                        "name": "Of science"
                    },
                    {
                        "code": "926",
                        "name": "Of useful arts"
                    },
                    {
                        "code": "927",
                        "name": "Of fine arts"
                    },
                    {
                        "code": "928",
                        "name": "Of literature"
                    },
                    {
                        "code": "929",
                        "name": "Genealogy and Heraldry"
                    }
                ]
            },
            {
                "code": "930",
                "name": "ANCIENT HISTORY",
                "children": [
                    {
                        "code": "931",
                        "name": "Chinese"
                    },
                    {
                        "code": "932",
                        "name": "Egyptian"
                    },
                    {
                        "code": "933",
                        "name": "Jewish"
                    },
                    {
                        "code": "934",
                        "name": "Indian"
                    },
                    {
                        "code": "935",
                        "name": "Persian"
                    },
                    {
                        "code": "936",
                        "name": "Keltic"
                    },
                    {
                        "code": "937",
                        "name": "Roman"
                    }
                ]
            },
            {
                "code": "940",
                "name": "Modern EUROPE",
                "children": [
                    {
                        "code": "941",
                        "name": "Scotland and Ireland"
                    },
                    {
                        "code": "942",
                        "name": "England"
                    },
                    {
                        "code": "943",
                        "name": "Germany and Austria"
                    },
                    {
                        "code": "944",
                        "name": "France"
                    },
                    {
                        "code": "945",
                        "name": "Italy"
                    },
                    {
                        "code": "946",
                        "name": "Spain and Portugal"
                    },
                    {
                        "code": "947",
                        "name": "Russia"
                    },
                    {
                        "code": "948",
                        "name": "Scandinavia"
                    }
                ]
            },
            {
                "code": "950",
                "name": "Modern ASIA",
                "children": [
                    {
                        "code": "951",
                        "name": "China"
                    },
                    {
                        "code": "952",
                        "name": "Japan"
                    },
                    {
                        "code": "953",
                        "name": "Arabia"
                    },
                    {
                        "code": "954",
                        "name": "India"
                    },
                    {
                        "code": "955",
                        "name": "Persia"
                    },
                    {
                        "code": "956",
                        "name": "Turkey in Asia"
                    },
                    {
                        "code": "957",
                        "name": "Siberia"
                    },
                    {
                        "code": "958",
                        "name": "Afghanistan"
                    }
                ]
            },
            {
                "code": "960",
                "name": "Modern AFRICA",
                "children": [
                    {
                        "code": "962",
                        "name": "Egypt and Nubia"
                    },
                    {
                        "code": "963",
                        "name": "Abyssinia"
                    },
                    {
                        "code": "964",
                        "name": "Morocco"
                    },
                    {
                        "code": "965",
                        "name": "Algeria"
                    },
                    {
                        "code": "966",
                        "name": "Central Africa"
                    },
                    {
                        "code": "967",
                        "name": "Guinea"
                    },
                    {
                        "code": "968",
                        "name": "South Africa"
                    }
                ]
            },
            {
                "code": "970",
                "name": "Modern NORTH AMERICA",
                "children": [
                    {
                        "code": "971",
                        "name": "British America"
                    },
                    {
                        "code": "972",
                        "name": "Canada"
                    },
                    {
                        "code": "973",
                        "name": "United States and Territories"
                    },
                    {
                        "code": "974",
                        "name": "Eastern"
                    },
                    {
                        "code": "975",
                        "name": "Middle"
                    },
                    {
                        "code": "976",
                        "name": "Southern"
                    },
                    {
                        "code": "977",
                        "name": "Western"
                    },
                    {
                        "code": "978",
                        "name": "Mexico"
                    }
                ]
            },
            {
                "code": "980",
                "name": "Modern SOUTH AMERICA",
                "children": [
                    {
                        "code": "981",
                        "name": "Brazil"
                    },
                    {
                        "code": "982",
                        "name": "Argentine Republic"
                    },
                    {
                        "code": "983",
                        "name": "Chili"
                    },
                    {
                        "code": "984",
                        "name": "Bolivia"
                    },
                    {
                        "code": "985",
                        "name": "Peru"
                    },
                    {
                        "code": "986",
                        "name": "New Granada"
                    },
                    {
                        "code": "987",
                        "name": "Venezuela"
                    },
                    {
                        "code": "988",
                        "name": "Guiana"
                    },
                    {
                        "code": "989",
                        "name": "Other"
                    }
                ]
            },
            {
                "code": "990",
                "name": "Oceanica and Polar Regions",
                "children": [
                    {
                        "code": "991",
                        "name": "Malaysia"
                    },
                    {
                        "code": "992",
                        "name": "Sunda"
                    },
                    {
                        "code": "993",
                        "name": "Australasia"
                    },
                    {
                        "code": "994",
                        "name": "Australia"
                    },
                    {
                        "code": "995",
                        "name": "New Guinea"
                    },
                    {
                        "code": "996",
                        "name": "Polynesia"
                    },
                    {
                        "code": "997",
                        "name": "Isolated islands"
                    },
                    {
                        "code": "998",
                        "name": "Arctic regions"
                    },
                    {
                        "code": "999",
                        "name": "Antarctic regions"
                    }
                ]
            }
        ]
    }
];
