import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const bulkData = [
  // --- IMAGEN 1 ---
  { p: "Acuña", m: "Arao", n: "Patricio Alejandro", rut: "12262734-9", nac: "25-10-72", email: "palejandro.aa72@gmail.com", cargo: "Conductor" },
  { p: "Rodriguez", m: "Hernandez", n: "Aimee", rut: "24939507-2", nac: "27-08-66", email: "aimee.r1966@gmail.com", cargo: "Medico" },
  { p: "Godoy", m: "Campusano", n: "Alejandra Andrea", rut: "12837330-6", nac: "30-09-74", email: "alejandragodoy.con@gmail.com", cargo: "Administrativo" },
  { p: "Godoy", m: "Coronao", n: "Alejandra Paz", rut: "16929628-6", nac: "07-10-88", email: "alejandragodoy.27@hotmail.com", cargo: "Enfermera(O)" },
  { p: "Aguayo", m: "Vidal", n: "Romina", rut: "19174969-3", nac: "18-09-95", email: "rominaaguayovidal@gmail.com", cargo: "Administrativo" },
  { p: "Agüero", m: "Hernández", n: "Karen Andrea", rut: "17863299-K", nac: "08-03-91", email: "karenagueroh@gmail.com", cargo: "Enfermera(O)" },
  { p: "Aguilera", m: "Quintana", n: "Oldenis", rut: "12119555-0", nac: "26-07-65", email: "oldi.aguilera.quintana@gmail.com", cargo: "Auxiliar De Servicio" },
  { p: "Alvarado", m: "Muñoz", n: "Claudio Andres", rut: "13401714-7", nac: "16-08-78", email: "kkoandres@gmail.com", cargo: "Informatico" },
  { p: "Perez", m: "Rosales", n: "Ana Patricia", rut: "7911199-6", nac: "27-07-56", email: "apperezr@gmail.com", cargo: "Enfermera(O)" },
  { p: "Jaure", m: "Villarroel", n: "Andrea Beatriz", rut: "16168472-4", nac: "12-06-85", email: "andreajaurevillarroel@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Anabalon", m: "Gutierrez", n: "Eder Andres", rut: "15849337-3", nac: "09-05-84", email: "eder.anabalon@gmail.com", cargo: "Profesor Educación Fisica" },
  { p: "Angulo", m: "Grandon", n: "Natalia Andrea", rut: "19272168-7", nac: "26-09-95", email: "natalia.angulograndon@gmail.com", cargo: "Nutricionista" },
  { p: "Antillanca", m: "Ñancumil", n: "Emilia Alejandra", rut: "20881915-1", nac: "23-09-01", email: "emiliantillanca2023@gmail.com", cargo: "Nutricionista" },
  { p: "Arriagada", m: "Merino", n: "Constanza Mabel", rut: "18133041-4", nac: "15-04-92", email: "arriagadamerino.c@gmail.com", cargo: "Odontologo" },
  { p: "Tapia", m: "Arrate", n: "Angelica Maria", rut: "15265924-5", nac: "27-02-80", email: "angearrate@gmail.com", cargo: "Auxiliar De Servicio" },
  { p: "Asenjo", m: "Calderón", n: "Aníbal Cornelio", rut: "18843786-9", nac: "13-09-94", email: "anibalasenjo94@gmail.com", cargo: "Conductor" },
  { p: "Avendaño", m: "Chocano", n: "Katherine Edith", rut: "19552786-5", nac: "29-01-97", email: "katherineavendanoch@gmail.com", cargo: "Administrativo" },
  { p: "Ávila", m: "Vera", n: "Nicoll Magdalena", rut: "17694362-9", nac: "22-02-91", email: "pbrfernandez@gmail.com", cargo: "Odontologo" },
  { p: "Bravo", m: "De La Guarda", n: "Armando Emir", rut: "15548342-3", nac: "04-09-83", email: "armbravo@gmail.com", cargo: "Odontologo" },
  { p: "Maclean", m: "Acuña", n: "Barbara Rocio", rut: "18776279-0", nac: "16-02-87", email: "barbara.maclean.a@gmail.com", cargo: "Odontologo" },
  { p: "Ballestero", m: "Cardenas", n: "Rodrigo Valentin", rut: "20176576-5", nac: "29-05-99", email: "rodrigo.ballestero29@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Barra", m: "Godoy", n: "Eduardo Rodrigo", rut: "15712860-4", nac: "07-04-84", email: "eduardobarragodoy@gmail.com", cargo: "Auxiliar De Servicio" },
  { p: "Vera", m: "Quijon", n: "Camilo Antonio", rut: "16871292-8", nac: "20-11-87", email: "camilov87@gmail.com", cargo: "Terapeuta Ocupacional" },
  { p: "Barra", m: "Martinez", n: "Javier Alejandro", rut: "16543205-3", nac: "20-03-87", email: "javierbarra.m87@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Beltran", m: "Pardo", n: "Catalina Paz", rut: "19485663-6", nac: "30-01-97", email: "dra.catalinapardo@gmail.com", cargo: "Medico" },
  { p: "Borquez", m: "Aguero", n: "Trachael Danae Del Carmen", rut: "19555031-k", nac: "04-06-97", email: "trachael.danae7@gmail.com", cargo: "Enfermera(O)" },
  { p: "Boutaud", m: "Miranda", n: "Carla Daniela", rut: "18288676-9", nac: "14-01-93", email: "carla.boutaud@gmail.com", cargo: "Matron(A)" },
  { p: "Pulgar", m: "Segovia", n: "Carlos Emilio", rut: "20469606-3", nac: "25-03-00", email: "carlospulgar@ug.uchile.cl", cargo: "Medico" },
  { p: "Roa", m: "Torres", n: "Carolina Andrea", rut: "13319395-2", nac: "03-02-77", email: "estadisticasfutrono@gmail.com", cargo: "Tecnico Administrativo Nivel Superior" },
  { p: "Bravo", m: "Balmaceda", n: "Eduardo Sebastian", rut: "15384966-8", nac: "23-03-83", email: "bravobaleduardo@gmail.com", cargo: "Quimico Farmaceutico" },
  { p: "Cabezas", m: "Cabezas", n: "Evelyn Prisila", rut: "18843876-8", nac: "27-03-90", email: "evelyncabezasfutrono@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Jobis", m: "Pizarro", n: "Carolina Fabiola", rut: "18549377-6", nac: "31-05-93", email: "carito.jobis@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Cabrera", m: "Gatica", n: "Dina Nicol", rut: "16929519-0", nac: "17-06-88", email: "cdina1494@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Canelo", m: "Nigoevic", n: "Constanza", rut: "20471624-2", nac: "10-07-00", email: "", cargo: "Medico" },
  { p: "Cardenas", m: "Fuentealba", n: "Valentina Paola", rut: "20076787-K", nac: "21-11-98", email: "valeecardenasf@gmail.com", cargo: "Matron(A)" },
  { p: "Cárdenas", m: "Azocar", n: "Sofia Elizabeth", rut: "20924675-9", nac: "13-06-01", email: "sofiaazocar1306@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Castillo", m: "Pérez", n: "Lucas Eduardo", rut: "19886041-7", nac: "11-09-98", email: "cd.lucas.castillo@gmail.com", cargo: "Odontologo" },
  { p: "Chaipul", m: "Diaz", n: "Cecilia Veronica", rut: "13588778-1", nac: "06-06-79", email: "cchaipul7979@gmail.com", cargo: "Tecnico Administrativo Nivel Superior" },
  { p: "Guzman", m: "Sobarzo", n: "Claudia Alejandra", rut: "12164243-3", nac: "03-09-74", email: "cayifutrono@gmail.com", cargo: "Tecnico Administrativo Nivel Superior" },
  { p: "Hualque", m: "Quintana", n: "Claudia Andrea", rut: "14348498-K", nac: "03-04-78", email: "claudiahualqueq@hotmail.com", cargo: "Asistente Social" },
  { p: "Corvalan", m: "Troncoso", n: "Claudia Maria Elizabeth", rut: "12008609-K", nac: "11-10-79", email: "claudiaacorvalanf@gmail.com", cargo: "Podologo(A)" },
  { p: "Castro", m: "Diocares", n: "Maritza Alejandra", rut: "12337681-1", nac: "09-12-73", email: "maritza.castrodio@gmail.com", cargo: "Administrativo" },
  { p: "Fernandez", m: "Serres", n: "Claudia Ximena", rut: "11424394-9", nac: "06-05-69", email: "fernandezserrescla@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Catalán", m: "Delgado", n: "Cecilia Del Pilar", rut: "12206059-4", nac: "02-02-72", email: "ceci.pili72@gmail.com", cargo: "Auxiliar De Servicio" },
  { p: "Catalán", m: "Gutiérrez", n: "Patricio Andrés", rut: "17511565-K", nac: "16-12-89", email: "catalangutierrez89@gmail.com", cargo: "Administrativo" },

  // --- IMAGEN 2 ---
  { p: "Cerna", m: "Ojeda", n: "Mauricio Andres", rut: "16805719-9", nac: "04-12-87", email: "mojeda.cerna@gmail.com", cargo: "Kinesiologo" },
  { p: "Burgos", m: "Hulchicoy", n: "Claudio Enrique", rut: "14084461-6", nac: "04-05-81", email: "claenribur@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Perez", m: "Oporto", n: "Claudio Ismael", rut: "16541110-2", nac: "23-07-86", email: "", cargo: "Kinesiologo" },
  { p: "Claverol", m: "Martínez", n: "Paola Francesca", rut: "16096392-1", nac: "26-02-85", email: "pclaverolm@gmail.com", cargo: "Administrativo" },
  { p: "Comulay", m: "Treuquil", n: "Luisa Yesenia", rut: "18284300-8", nac: "31-10-93", email: "luisacomulay@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Curinao", m: "Collil", n: "Harmin", rut: "13160710-5", nac: "19-06-77", email: "curinao1977@gmail.com", cargo: "Conductor" },
  { p: "Aravena", m: "Beroiza", n: "Daisy Beatriz", rut: "16168651-4", nac: "09-01-86", email: "daravena46@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Vera", m: "Diaz", n: "Daniel Hernan", rut: "17297148-2", nac: "03-03-90", email: "danielveradz@gmail.com", cargo: "Tecnologo Medico" },
  { p: "Elgueta", m: "Villarroel", n: "Sebastian Andres", rut: "17237344-5", nac: "25-05-90", email: "sebastian.elguetav@gmail.com", cargo: "Odontologo" },
  { p: "Iceta", m: "Haro", n: "Daniela Alejandra", rut: "16557571-7", nac: "26-05-87", email: "dani.iceta.haro@gmail.com", cargo: "Nutricionista" },
  { p: "Espinoza", m: "Ceballos", n: "Sofía", rut: "20314236-6", nac: "02-10-99", email: "sofia.ing.en.adm@gmail.com", cargo: "Administrativo" },
  { p: "Paredes", m: "Silva", n: "Daniela Andrea", rut: "17359410-0", nac: "21-10-89", email: "dani.paredes21@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Estrada", m: "Jara", n: "Antonieta", rut: "19217486-4", nac: "22-09-96", email: "estradajara22@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Maureira", m: "Pineda", n: "Dapner Estefanía", rut: "18133210-7", nac: "19-03-92", email: "dapner.maureira@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Fernández", m: "Riquelme", n: "Loreto Katherine", rut: "18288182-1", nac: "17-11-92", email: "eu.loretodefernandez@gmail.com", cargo: "Enfermera(O)" },
  { p: "Cabrera", m: "Gatica", n: "Dina Nicol", rut: "16929519-0", nac: "17-06-88", email: "", cargo: "Tecnico De Nivel Superior" },
  { p: "Fernández", m: "Riquelme", n: "Priscilla Yenifer", rut: "16564097-7", nac: "08-05-87", email: "pbrfernandez@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Burgos", m: "Vergara", n: "Edith Leonor", rut: "14139430-4", nac: "01-06-81", email: "burgosvergaraedith@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Ferreira", m: "Azocar", n: "Nieves Patricio", rut: "10345473-5", nac: "05-08-66", email: "nievespatricioferreira@gmail.com", cargo: "Conductor" },
  { p: "Figueroa", m: "Peña", n: "Emilio", rut: "19625002-6", nac: "03-12-97", email: "emiliofp1@hotmail.com", cargo: "Medico" },
  { p: "Martinez", m: "Barrera", n: "Elson Floromin", rut: "16929789-4", nac: "24-01-89", email: "elson.martinez@hotmail.com", cargo: "Auxiliar De Servicio" },
  { p: "Flandez", m: "Rodriguez", n: "Andres Alejandro", rut: "19553799-2", nac: "27-12-96", email: "andresflandez123@gmail.com", cargo: "Kinesiologo" },
  { p: "Flores", m: "Gómez", n: "Camila Andrea", rut: "18886306-k", nac: "19-07-94", email: "flores.gomez.camila@gmail.com", cargo: "Psicologo" },
  { p: "Flores", m: "Delgado", n: "Rosa Ester", rut: "14038037-7", nac: "10-04-81", email: "ester40flores@gmail.com", cargo: "Auxiliar De Servicio" },
  { p: "Oyedo", m: "Delgado", n: "Essan Rubén", rut: "8066101-0", nac: "08-07-60", email: "ruben.oyedo50@gmail.com", cargo: "Conductor" },
  { p: "Reyes", m: "Alarcon", n: "Eva Viviana", rut: "14084519-1", nac: "28-10-78", email: "eva_reyes78@hotmail.com", cargo: "Auxiliar De Servicio" },
  { p: "Gallardo", m: "Jara", n: "Mariana", rut: "18549219-2", nac: "02-04-93", email: "mariana17gj@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "García", m: "Delgado", n: "Mirtha Andrea", rut: "10127817-4", nac: "11-09-74", email: "andreagarciad@gmail.com", cargo: "Enfermera(O)" },
  { p: "Pitripan", m: "Godoy", n: "Exequel Gonzalo", rut: "13588620-3", nac: "14-01-79", email: "gonzapitrigod@gmail.com", cargo: "Tecnico Administrativo Nivel Superior" },
  { p: "Gonzalez", m: "Cumian", n: "Andrea Susana", rut: "17358995-6", nac: "19-09-87", email: "andrea.gonzalez8724@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Sandoval", m: "Arizmendi", n: "Fabian Luis", rut: "17289245-0", nac: "17-12-86", email: "fabiansandovalarizmendi@gmail.com", cargo: "Matron(A)" },
  { p: "Muñoz", m: "Muñoz", n: "Fernando Antonio", rut: "19172536-8", nac: "06-04-96", email: "fer6antmu@gmail.com", cargo: "Enfermera(O)" },
  { p: "Rivas", m: "Valdebenito", n: "Fernando Ariel", rut: "17536681-4", nac: "18-09-76", email: "fernandorivasval@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Huenupl", m: "Millapi", n: "Florinda Luz", rut: "10274678-3", nac: "29-10-65", email: "florindahuenup@hotmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Gonzalez", m: "Pulgar", n: "Pamela", rut: "13767859-4", nac: "12-02-80", email: "pgonzalez.matrona@gmail.com", cargo: "Matron(A)" },
  { p: "Montecinos", m: "Obando", n: "Francisca Beatriz", rut: "18733348-2", nac: "11-04-94", email: "franciscamontecinosobando@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "González", m: "Mancilla", n: "Bárbara Sofía", rut: "19466419-2", nac: "11-05-97", email: "BSOFIAGONZALEZM@GMAIL.COM", cargo: "Psicologo" },
  { p: "González", m: "Hernández", n: "Carolina Dolena", rut: "19552791-1", nac: "02-04-96", email: "cgonzalezhernandez1309@gmail.com", cargo: "Kinesiologo" },
  { p: "Aravena", m: "Beroiza", n: "Gabriela Nataly", rut: "16929359-7", nac: "01-03-88", email: "g.aravena0103@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Cespedes", m: "Gutierrez", n: "Gastón Ricardo", rut: "15294549-3", nac: "17-11-82", email: "gcespedesgut@gmail.com", cargo: "Conductor" },
  { p: "Villalobos", m: "Briones", n: "Génesis Josefina", rut: "16541571-K", nac: "21-10-87", email: "josefinavillalobosb@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Arce", m: "Treuquil", n: "Gerardo Andres", rut: "18189798-8", nac: "21-09-92", email: "gerardo.arce.tre@gmail.com", cargo: "Enfermera(O)" },
  { p: "Reyes", m: "Riquelme", n: "Gloria Beatriz", rut: "12995250-4", nac: "22-09-76", email: "gloriarr4950@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "González", m: "Valdés", n: "Rayen Alejandra", rut: "19598664-9", nac: "08-07-97", email: "raal.gonval@gmail.com", cargo: "Medico" },
  { p: "Gonzalez", m: "Castillo", n: "Gloria Isabel", rut: "15728630-7", nac: "17-11-83", email: "gloriagonzalez356@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Hualquipan", m: "Palnen", n: "Gloria Ivette", rut: "13156300-0", nac: "19-02-72", email: "gloria.hp1972@gmail.com", cargo: "Nutricionista" },
  { p: "Gonzalez", m: "Lobos", n: "Yoni Osvaldo", rut: "15577032-5", nac: "26-04-84", email: "yoni.gonzalez84@hotmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Arriagada", m: "Delgado", n: "Gonzalo", rut: "14471732-5", nac: "10-01-74", email: "arriagada.villanueva@gmail.com", cargo: "Tecnico Administrativo Nivel Superior" },
  { p: "Gual", m: "Ortiz", n: "Nicole Andrea", rut: "20601523-3", nac: "03-09-00", email: "nicole.andrea.gual.ortiz@gmail.com", cargo: "Enfermera(O)" },
  { p: "Valenzuela", m: "Mellado", n: "Graciela Pilar", rut: "13588617-3", nac: "25-02-79", email: "graci.valenzuela1979@gmail.com", cargo: "Administrativo" },
  { p: "Guarda", m: "Burgos", n: "Gloria Esther", rut: "11705925-1", nac: "30-06-71", email: "gloriaguarda1971@gmail.com", cargo: "Administrativo" },
  { p: "Manzano", m: "Diaz", n: "Haydee Veronica", rut: "8058449-0", nac: "10-04-60", email: "gestionveronica@gmail.com", cargo: "Administrativo" },
  { p: "Vera", m: "Silva", n: "Herminda Carmen", rut: "12390682-9", nac: "15-05-73", email: "carmen.verahcvs@gmail.com", cargo: "Administrativo" },
  { p: "Filcun", m: "Bravo", n: "Hernan Marcelo", rut: "10792166-4", nac: "15-03-67", email: "hernanfilcun@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Olave", m: "Castillo", n: "Hugo Eduardo", rut: "16829987-7", nac: "08-02-89", email: "hugolave@gmail.com", cargo: "Odontologo" },

  // --- IMAGEN 3 ---
  { p: "Gutierrez", m: "Castillo", n: "Joaquín Daniel", rut: "19903579-7", nac: "19-05-98", email: "joacogutierrez@gmail.com", cargo: "Medico" },
  { p: "Reyes", m: "Reyes", n: "Irene Margoth", rut: "16556363-8", nac: "09-10-87", email: "imar.2602@gmail.com", cargo: "Administrativo" },
  { p: "Palma", m: "Silva", n: "Isidora Ignacia", rut: "20159455-3", nac: "31-08-99", email: "palmaisidora.is@gmail.com", cargo: "Medico" },
  { p: "Huenupan", m: "Huenupan", n: "Romina", rut: "16556468-5", nac: "31-05-89", email: "huenupanr@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Jelves", m: "Contreras", n: "Angela Patricia", rut: "20055030-7", nac: "26-02-99", email: "", cargo: "Tecnico De Nivel Superior" },
  { p: "Martinez", m: "Barrera", n: "Jaime Alfredo", rut: "12148857-4", nac: "27-06-71", email: "martijaime1@gmail.com", cargo: "Administrativo" },
  { p: "Jerez", m: "Gonzalez", n: "Sara Isabel", rut: "20536427-7", nac: "22-09-00", email: "saritajerezg123@gmail.com", cargo: "Enfermera(O)" },
  { p: "Lara", m: "Curinao", n: "Juan Antonio", rut: "17725908-K", nac: "10-10-90", email: "jlaracurinao@gmail.com", cargo: "Nutricionista" },
  { p: "Lehuey", m: "Gallardo", n: "Javiera Mariel", rut: "20634915-8", nac: "17-11-00", email: "jableramariel@gmail.com", cargo: "Administrativo" },
  { p: "Leiva", m: "Alarcón", n: "María José", rut: "19463916-3", nac: "15-10-95", email: "leivaalarconmariajose@gmail.com", cargo: "Matron(A)" },
  { p: "Farfan", m: "Farfan", n: "Jeannette Laura", rut: "10243085-9", nac: "30-06-67", email: "salaestimulacionfutrono@gmail.com", cargo: "Educadora De Parvulos" },
  { p: "Lermanda", m: "Sepúlveda", n: "Karla Rayén", rut: "18579154-8", nac: "30-03-94", email: "lermanda62@gmail.com", cargo: "Enfermera(O)" },
  { p: "Flores", m: "Carillanca", n: "Jocelyn", rut: "19198246-0", nac: "17-01-96", email: "96jocelynflores@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "López", m: "Herrera", n: "Josefa Constanza", rut: "20038803-8", nac: "25-11-98", email: "josefalopez@ug.uchile.cl", cargo: "Medico" },
  { p: "Maldonado", m: "Díaz", n: "Katherine Cecilia", rut: "15938938-3", nac: "22-08-84", email: "kathy.39.maldonado@gmail.com", cargo: "Auxiliar De Servicio" },
  { p: "Manns", m: "Fernandez", n: "Rosario Loreto", rut: "14083631-1", nac: "08-11-81", email: "rosarioloreto1981@gmail.com", cargo: "Psicologo" },
  { p: "Astroza", m: "Bravo", n: "Jose", rut: "12038289-6", nac: "17-05-67", email: "chicoastroza@hotmail.com", cargo: "Administrativo" },
  { p: "Manqui", m: "Comulay", n: "Yeli Adriana", rut: "15745149-9", nac: "03-01-81", email: "manquiadriana@gmail.com", cargo: "Auxiliar De Servicio" },
  { p: "Ceballos", m: "Molina", n: "Jose Ricardo", rut: "14036923-3", nac: "21-12-80", email: "ricardo.ceballosm@gmail.com", cargo: "Asistente Social" },
  { p: "Maureira", m: "Quezada", n: "Jose Rosendo", rut: "10340748-6", nac: "30-07-60", email: "josemaureiraquesada@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Yavar", m: "Fasani", n: "Juan Andres", rut: "16858754-6", nac: "28-03-88", email: "juanyavarf@gmail.com", cargo: "Kinesiologo" },
  { p: "Mansilla", m: "Gonzalez", n: "Yonatan Cristofer", rut: "16805466-1", nac: "21-10-87", email: "mansilla.enfa87@gmail.com", cargo: "Enfermera(O)" },
  { p: "Carcamo", m: "Barriga", n: "Juan Carlos", rut: "8206108-8", nac: "03-06-63", email: "carlos3993@gmail.com", cargo: "Auxiliar De Servicio" },
  { p: "Corvalan", m: "Fuentes", n: "Juan Carlos", rut: "9277024-9", nac: "01-11-62", email: "jcorvalanfuentes@gmail.com", cargo: "Conductor" },
  { p: "Espinoza", m: "Perez", n: "Juan Esteban", rut: "9192638-5", nac: "25-01-61", email: "espinozajuanp.1961@gmail.com", cargo: "Conductor" },
  { p: "Manzano", m: "Ávila", n: "Mauricio Esteban", rut: "16564728-9", nac: "07-04-87", email: "mauricio_manzano87@icloud.com", cargo: "Conductor" },
  { p: "Castellanos", m: "Galvez", n: "Juan Ramon", rut: "24939492-0", nac: "31-08-67", email: "jcastellanosgalvez@gmail.com", cargo: "Medico" },
  { p: "Gonzalez", m: "Arizmendi", n: "Juan Rolando", rut: "12337761-3", nac: "11-11-71", email: "juangonzalezarismendi@gmail.com", cargo: "Tecnico Administrativo Nivel Superior" },
  { p: "Angulo", m: "Ortiz", n: "Karen", rut: "15894789-7", nac: "12-12-84", email: "ps.karenangulo@gmail.com", cargo: "Psicologo" },
  { p: "Marchant", m: "Añazco", n: "Aracelys María Alicia", rut: "17863630-8", nac: "06-04-91", email: "aracelys.marchant@gmail.com", cargo: "Nutricionista" },
  { p: "Corvalan", m: "Guarda", n: "Karen Fabiola", rut: "16168378-7", nac: "19-10-84", email: "corvalan.karen@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Martinez", m: "López", n: "Marly Natalia", rut: "13161706-2", nac: "15-08-77", email: "mmartinezl.ps@gmail.com", cargo: "Psicologo" },
  { p: "Tiznado", m: "Higueras", n: "Karina Eliana", rut: "9133835-1", nac: "25-06-62", email: "karinatiznadoh@gmail.com", cargo: "Matron(A)" },
  { p: "Rios", m: "Jara", n: "Karina Rosmary", rut: "17297098-2", nac: "08-12-89", email: "kriosmatrona@gmail.com", cargo: "Matron(A)" },
  { p: "Martinez", m: "Poveda", n: "Roberto", rut: "19017786-6", nac: "11-05-95", email: "robertomartinez.p@ug.uchile.cl", cargo: "Medico" },
  { p: "Martínez", m: "Garcia", n: "Jaime Adolfo", rut: "20018025-9", nac: "03-07-99", email: "jaime.martinez.g14@gmail.com", cargo: "Tecnico Administrativo Nivel Superior" },
  { p: "Mellado", m: "Navarrete", n: "Matías Emilio", rut: "19840222-2", nac: "18-02-98", email: "drmatiasmellado@gmail.com", cargo: "Medico" },
  { p: "Perez", m: "Curinao", n: "Katherine Margoth", rut: "16379816-6", nac: "05-04-86", email: "katherine.perez.c@gmail.com", cargo: "Tecnico Administrativo Nivel Superior" },
  { p: "Ramirez", m: "Hidalgo", n: "Katherinne Cecilia", rut: "16671242-4", nac: "27-12-87", email: "katy.ramirez.hidalgo@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Solis", m: "Perez", n: "Liliana Basilisa", rut: "10661235-8", nac: "25-10-67", email: "solisperezlili@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Milla", m: "Osorio", n: "Juan Pablo", rut: "20443911-7", nac: "28-02-00", email: "jotamo2000@gmail.com", cargo: "Odontologo" },
  { p: "Manquel", m: "Paillalef", n: "Lucrecia Uberlinda", rut: "18776108-5", nac: "09-01-95", email: "lucreciamanquel@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Mira", m: "Calhuante", n: "Yaritza Camila", rut: "17512327-K", nac: "19-05-90", email: "camilamira1990@gmail.com", cargo: "Auxiliar De Servicio" },
  { p: "Caceres", m: "Martinez", n: "Macarena Del Pilar", rut: "16200950-8", nac: "08-06-85", email: "maca.pcm@gmail.com", cargo: "Kinesiologo" },
  { p: "Mella", m: "Andrade", n: "Macarena Diana", rut: "16543029-8", nac: "31-08-86", email: "mella.macarena@gmail.com", cargo: "Nutricionista" },
  { p: "Sepulveda", m: "Curinao", n: "Macarena Soledad", rut: "16463837-5", nac: "26-06-86", email: "macarena.sepulveda25@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Miranda", m: "Guajardo", n: "Daniela Amanda", rut: "16871585-4", nac: "13-06-88", email: "damandami.dm@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Miranda", m: "Caballero", n: "Martina Elena", rut: "21409243-3", nac: "25-08-04", email: "martinamiranda.c23@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Küllmer", m: "Diocares", n: "Maria Angelica", rut: "13586657-1", nac: "16-01-79", email: "angelica.kullmer@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Vargas", m: "Silva", n: "Maria Beatriz", rut: "12139247-7", nac: "15-04-74", email: "beatrizvargas04@gmail.com", cargo: "Tecnico De Nivel Superior" },

  // --- IMAGEN 4 ---
  { p: "Hidalgo", m: "Barriga", n: "Maria Elena", rut: "17648534-5", nac: "15-09-90", email: "mariahidalgo@gmail.com", cargo: "Enfermera(O)" },
  { p: "Cerón", m: "Lobos", n: "Maria Erna Soledad", rut: "9195824-4", nac: "20-02-62", email: "mesole86@gmail.com", cargo: "Administrativo" },
  { p: "Montecinos", m: "Bertín", n: "Ignacio Orlando", rut: "18776309-6", nac: "11-08-95", email: "montecinos726@gmail.com", cargo: "Enfermera(O)" },
  { p: "Ulloa", m: "Silva", n: "Maria Jose", rut: "17296925-9", nac: "30-12-88", email: "kote.tggu@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Morales", m: "Pineda", n: "Soledad Alexandra", rut: "18843652-8", nac: "01-07-94", email: "morales.soledad107@gmail.com", cargo: "Terapeuta Ocupacional" },
  { p: "Muñoz", m: "Concha", n: "Evelyn", rut: "17725955-1", nac: "24-10-90", email: "evelyn.muc.90@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Neguiman", m: "Roa", n: "Carolina Andrea", rut: "17201685-5", nac: "14-11-89", email: "c.neguiman@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Obando", m: "Villarroel", n: "Abigail Sarahy", rut: "18843929-2", nac: "06-02-95", email: "abigail.obando.villarroel@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Obando", m: "Delgado", n: "Claudia Ximena", rut: "20345714-6", nac: "23-09-99", email: "claudia.obde.23@gmail.com", cargo: "Enfermera(O)" },
  { p: "Peralta", m: "Correa", n: "Matias Daniel", rut: "17512309-1", nac: "23-05-90", email: "mati.peralta.correa@gmail.com", cargo: "Odontologo" },
  { p: "Opazo", m: "Guzmán", n: "Javiera Giselle", rut: "18775947-1", nac: "21-11-94", email: "javiopazoguzman@hotmail.com", cargo: "Nutricionista" },
  { p: "Opazo", m: "Muñoz", n: "Jordy", rut: "18549222-2", nac: "06-05-93", email: "JORDYOPAZOM@GMAIL.COM", cargo: "Kinesiologo" },
  { p: "Ortiz", m: "Ortiz", n: "Maria Jesus", rut: "20017957-9", nac: "11-06-99", email: "mjmf1012@gmail.com", cargo: "Administrativo" },
  { p: "Ormeño", m: "Varela", n: "Mauricio Obed", rut: "15261374-1", nac: "06-01-82", email: "mau_0601@hotmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Jerez", m: "Molina", n: "Miguel Alejandro", rut: "13319584-K", nac: "06-01-77", email: "paramedicomj@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Ruiz", m: "Gallardo", n: "Miguel Angel", rut: "15745163-4", nac: "30-05-84", email: "chaleco2008@live.cl", cargo: "Conductor" },
  { p: "Dubreuil", m: "Santana", n: "Miguel Angel", rut: "15961032-2", nac: "14-05-71", email: "miguel.dusa@gmail.com", cargo: "Conductor" },
  { p: "Pérez", m: "Velásquez", n: "Jocelyn Alejandra", rut: "17726272-2", nac: "17-11-90", email: "jocelynperezvelasquez@gmail.com", cargo: "Administrativo" },
  { p: "Reyes", m: "Raillanca", n: "Monica Fabiola", rut: "15745143-K", nac: "05-03-84", email: "mreyes910@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Valdés", m: "Guarda", n: "Monica Paola", rut: "17726252-8", nac: "30-06-91", email: "pollita_xlop@hotmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Roa", m: "Munzenmayer", n: "Nancy Elizabeth", rut: "11424875-4", nac: "20-01-69", email: "nancyroam@gmail.com", cargo: "Administrativo" },
  { p: "Concha", m: "Vargas", n: "Natalia Abigail", rut: "16872322-9", nac: "26-10-88", email: "nacvargas@gmail.com", cargo: "Nutricionista" },
  { p: "Pitripan", m: "Garces", n: "Javiera Antonia", rut: "21618801-2", nac: "27-06-04", email: "garcesjaviera967@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Portolés", m: "Cabezas", n: "Francisca Belén", rut: "19891613-7", nac: "20-04-98", email: "dra.franciscaportoles@gmail.com", cargo: "Odontologo" },
  { p: "Raddatz", m: "Caro", n: "Yorka", rut: "14086507-9", nac: "07-08-81", email: "raddatz.yorka@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Ramirez", m: "Pitripan", n: "Yessenia Paulina", rut: "18843847-4", nac: "27-11-94", email: "ramirezyessenia353@gmail.com", cargo: "Administrativo" },
  { p: "Ramírez", m: "Muñoz", n: "Pablo David", rut: "15459702-6", nac: "09-10-82", email: "coman07.pro@gmail.com", cargo: "Conductor" },
  { p: "Pitripan", m: "Godoy", n: "Noelia Noemí", rut: "12749552-1", nac: "22-07-75", email: "noemipitri1975@gmail.com", cargo: "Auxiliar De Servicio" },
  { p: "Barría", m: "Jorquera", n: "Norma Maria", rut: "16603331-4", nac: "18-06-87", email: "norm.malubarria@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Delgado", m: "Carrillo", n: "Norma Ximena", rut: "10777770-9", nac: "22-08-67", email: "normaximenadelgado@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Rios", m: "Reyes", n: "Eva Belen", rut: "20017434-8", nac: "03-03-99", email: "bele.03.br@gmail.com", cargo: "Administrativo" },
  { p: "Vera", m: "Malverde", n: "Pablo Arturo", rut: "17725854-7", nac: "26-06-90", email: "pveramalverde@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Riquelme", m: "Osses", n: "Magdalena Alejandra", rut: "18888073-8", nac: "29-03-95", email: "magdalenariquelmeo@gmail.com", cargo: "Enfermera(O)" },
  { p: "Rivas", m: "Aravena", n: "Nicole Nathaly", rut: "17963542-9", nac: "17-07-91", email: "kiga.nicolerivas@gmail.com", cargo: "Kinesiologo" },
  { p: "Figueroa", m: "Rios", n: "Paola Andrea", rut: "15745010-7", nac: "07-11-81", email: "paolaandreafigueroarios@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Rivas", m: "Fischer", n: "Paula Beatriz", rut: "20840725-2", nac: "14-09-01", email: "paularf.001@gmail.com", cargo: "Administrativo" },
  { p: "Castro", m: "Diocares", n: "Patricia Jimena", rut: "11590608-9", nac: "05-10-70", email: "cpjjcastro@hotmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Rojas", m: "Silva", n: "Ivany Andrea", rut: "19956008-5", nac: "23-05-98", email: "ivrys98@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Romero", m: "Inalaf", n: "Catalina Francisca", rut: "17985640-9", nac: "20-12-91", email: "", cargo: "Psicologo" },
  { p: "Mancilla", m: "Millaquen", n: "Paula", rut: "15293645-1", nac: "11-07-82", email: "paulaisabelmancilla@hotmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Romero", m: "Inalaf", n: "Pamela Mariel", rut: "15531233-5", nac: "26-08-83", email: "pamelamariel@live.cl", cargo: "Asistente Social" },
  { p: "Rothen", m: "Aguilar", n: "Maritza Mónica", rut: "15894555-K", nac: "30-06-84", email: "mrothen84@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Montecinos", m: "Montecinos", n: "Piero Anderzon", rut: "16871444-0", nac: "17-05-88", email: "pieromontt88@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Saez", m: "Acevedo", n: "Yoselyn Nicole", rut: "18321181-1", nac: "18-07-92", email: "yosisaez@hotmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "San Martín", m: "Santibañez", n: "Daniela Del Carmen", rut: "18245187-8", nac: "11-08-92", email: "daniisanmartin00@gmail.com", cargo: "Kinesiologo" },
  { p: "Sandoval", m: "Arcos", n: "Rocío", rut: "20160820-1", nac: "03-07-87", email: "rocio.sandovalar@gmail.com", cargo: "Podologo(A)" },
  { p: "Sandalla", m: "Solis", n: "Eric Ariel", rut: "19181586-6", nac: "21-10-95", email: "ericsandalla@gmail.com", cargo: "Kinesiologo" },
  { p: "Zambrano", m: "Flores", n: "Rocio Belen", rut: "17512156-0", nac: "05-04-90", email: "rocio.zambrano.5@gmail.com", cargo: "Enfermera(O)" },
  { p: "Sandoval", m: "Obando", n: "Yosett Araceli", rut: "20018344-4", nac: "04-09-99", email: "yosett19@gmail.com", cargo: "Matron(A)" },
  { p: "Sepúlveda", m: "Miranda", n: "Claudia Teresa", rut: "15269122-k", nac: "02-11-79", email: "CTSEPULVEDA.MI@GMAIL.COM", cargo: "Administrativo" },

  // --- IMAGEN 5 ---
  { p: "Montecinos", m: "Tapia", n: "Romina Fernanda", rut: "17296906-2", nac: "01-08-89", email: "rmontecinostapia@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Sepúlveda", m: "Manríquez", n: "Fabián", rut: "18438527-9", nac: "12-09-93", email: "sepulveda.m.fabian@gmail.com", cargo: "Medico" },
  { p: "Sepúlveda", m: "Valenzuela", n: "Marcelo Ignacio", rut: "19833678-5", nac: "26-05-98", email: "marsepvale@hotmail.com", cargo: "Conductor" },
  { p: "Silva", m: "Chacón", n: "Teresa Alejandra", rut: "17201199-3", nac: "30-08-89", email: "alejandrasilvachacon23@gmail.com", cargo: "Enfermera(O)" },
  { p: "Rosales", m: "Leal", n: "Rudy Artemio", rut: "12746557-6", nac: "14-12-74", email: "rudyrosalesleal@gmail.com", cargo: "Conductor" },
  { p: "Solís", m: "Castillo", n: "Valeria", rut: "19248943-1", nac: "16-03-96", email: "ps.valeriasolis@gmail.com", cargo: "Psicologo" },
  { p: "Soto", m: "Saavedra", n: "Carlos Alejandro", rut: "19833894-1", nac: "23-12-98", email: "carlos.soto.uach@gmail.com", cargo: "Odontologo" },
  { p: "Cardenas", m: "Quechuyao", n: "Sebastian", rut: "17511552-8", nac: "15-09-89", email: "scardenasquehuyao@gmail.com", cargo: "Odontologo" },
  { p: "Soto", m: "Torres", n: "Johanna Betzabe", rut: "16383112-0", nac: "08-07-86", email: "johanna.soto.torres@gmail.com", cargo: "Administrativo" },
  { p: "Ballestero", m: "Valenzuela", n: "Sebastian Mario Arnoldo", rut: "10092126-K", nac: "07-05-64", email: "sballesterovalenzuela@gmail.com", cargo: "Auxiliar De Servicio" },
  { p: "Tapia", m: "Troncoso", n: "Viviana Del Carmen", rut: "17297269-1", nac: "12-06-90", email: "vivianatapia972@gmail.com", cargo: "Auxiliar De Servicio" },
  { p: "Torres", m: "Vidal", n: "Ana Maria", rut: "19555305-K", nac: "10-06-97", email: "torresvidalanamaria@gmail.com", cargo: "Enfermera(O)" },
  { p: "Torres", m: "Silva", n: "Yennifer Jacqueline", rut: "18549314-8", nac: "20-07-93", email: "yenni.torres.s@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Mardones", m: "Obando", n: "Sofía Flor", rut: "15961176-0", nac: "08-07-86", email: "smarohigienista@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Sepulveda", m: "Castro", n: "Sofía Ivone", rut: "18321535-3", nac: "17-09-92", email: "sofia.sepulvedacastro@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Troncoso", m: "Meza", n: "Yanira Alejandra", rut: "13401927-1", nac: "25-09-74", email: "troncosomezayanira@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Ulloa", m: "Silva", n: "Daniela Alejandra", rut: "16543114-8", nac: "05-05-87", email: "daulsi1987@gmail.com", cargo: "Enfermera(O)" },
  { p: "Uribe", m: "Contreras", n: "Romina Fernanda", rut: "18321271-0", nac: "18-09-92", email: "romina.uribec@gmail.com", cargo: "Enfermera(O)" },
  { p: "Weiser", m: "Cardenas", n: "Stephanie Scarlett", rut: "18843977-2", nac: "07-04-95", email: "swelsercardenas@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Marabolí", m: "Godoy", n: "Susana Camila", rut: "19249352-8", nac: "19-04-96", email: "susanamayobollodologia@gmail.com", cargo: "Podologo(A)" },
  { p: "Valenzuela", m: "Muñoz", n: "Karla", rut: "17549925-3", nac: "01-12-91", email: "karlita.valenzuela91@gmail.com", cargo: "Kinesiologo" },
  { p: "Van Wijk", m: "Lucero", n: "Stephanie Johana", rut: "18001780-1", nac: "31-08-91", email: "vanwijklucero@gmail.com", cargo: "Matron(A)" },
  { p: "Vargas", m: "Curinao", n: "Gloria Magdalena", rut: "15269410-5", nac: "10-05-82", email: "gloovargas.1005@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Beltran", m: "Muñoz", n: "Valeria Nataly", rut: "17297136-9", nac: "26-02-90", email: "beltranvaleria1990@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Torres", m: "Soto", n: "Valeska Johani", rut: "13401683-3", nac: "22-07-78", email: "valeskatorresy@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Vega", m: "Barrientos", n: "Vanessa Elizabeth", rut: "15928829-3", nac: "12-11-84", email: "vega.vanessa22@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Figueroa", m: "Neguiman", n: "Victor Hugo", rut: "15265991-1", nac: "12-04-82", email: "victorfutrono@gmail.com", cargo: "Conductor" },
  { p: "Vallejos", m: "Lehuey", n: "Victor Leonel", rut: "8306764-0", nac: "25-07-60", email: "nasariosaventura@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Sepulveda", m: "Barrera", n: "Vinka Cecilia", rut: "11138887-3", nac: "01-11-67", email: "sepulvedavinka@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Vega", m: "Rosales", n: "Carla Beatriz", rut: "13319566-1", nac: "14-06-77", email: "charlyvr30@hotmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Manqui", m: "Ñancumil", n: "Ximena Edith", rut: "16168806-1", nac: "16-04-86", email: "xime.manqui16@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Gonzalez", m: "Igor", n: "Yalena Roxana", rut: "13588653-K", nac: "19-12-78", email: "yale1912gonzalez@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Vergara", m: "Carrasco", n: "José", rut: "19833765-K", nac: "28-05-98", email: "joseveragaracarrasco98@gmail.com", cargo: "Conductor" },
  { p: "Vergara", m: "Monsalve", n: "María Valeria", rut: "17550053-7", nac: "28-02-92", email: "valeriavergaram@gmail.com", cargo: "Odontologo" },
  { p: "Vidal", m: "Rodriguez", n: "Paula Maritza", rut: "17858493-6", nac: "12-02-91", email: "4mb4rlisbeth@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Vilches", m: "Torres", n: "Dafne", rut: "17840914-K", nac: "14-09-91", email: "dafne.vilches2@gmail.com", cargo: "Administrativo" },
  { p: "Villablanca", m: "Molina", n: "Catalina Andrea", rut: "20924574-4", nac: "12-11-01", email: "villamoli12@gmail.com", cargo: "Administrativo" },
  { p: "Villagrán", m: "Torres", n: "Franchesca Harlin", rut: "19744692-7", nac: "22-06-97", email: "franchescavillagran16@hotmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Villanueva", m: "Triviño", n: "Gonzalo", rut: "18843862-8", nac: "22-01-95", email: "gonzalo.villanuevat1@gmail.com", cargo: "Enfermera(O)" },
  { p: "Ibarra", m: "Moran", n: "Yorik Del Carmen", rut: "8364963-1", nac: "14-07-60", email: "yorik.ibarra@gmail.com", cargo: "Conductor" },
  { p: "Cardenas", m: "Delgado", n: "Yory Andres", rut: "12995486-8", nac: "13-09-76", email: "yocardenas1@gmail.com", cargo: "Conductor" },
  { p: "Zambrano", m: "Levancini", n: "Sergio Ivan", rut: "11682049-8", nac: "21-11-70", email: "sergioivanzambrano@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Zurita", m: "Fernández", n: "Ana María", rut: "19552779-2", nac: "21-02-97", email: "anitazurita78@gmail.com", cargo: "Enfermera(O)" }
];

function getAreaType(cargo: string): "CLINICO" | "ADMINISTRATIVO" {
  const c = cargo.toUpperCase();
  if (
    c.includes("CONDUCTOR") ||
    c.includes("ADMINISTRATIVO") ||
    c.includes("INFORMATICO") ||
    c.includes("SERVICIO") ||
    c.includes("AUXILIAR")
  ) {
    return "ADMINISTRATIVO";
  }
  return "CLINICO";
}

async function main() {
  console.log(`🚀 Iniciando importación de ${bulkData.length} funcionarios desde las transcripciones...`);

  // Clear existing tables first
  await prisma.personnel.deleteMany({});
  await prisma.personalLogistica.deleteMany({});
  console.log("🧹 Tablas vaciadas de forma segura.");

  const seenNames = new Set<string>();
  let importedCount = 0;

  for (const item of bulkData) {
    // Reconstruir nombre completo en Mayúsculas y normalizar espacios
    const rawFullName = `${item.n} ${item.p} ${item.m}`.trim().replace(/\s+/g, ' ');
    const fullName = rawFullName.toUpperCase();

    // Check for duplicates in this run
    if (seenNames.has(fullName)) {
      console.log(`⚠️ Ignorando duplicado de: ${fullName}`);
      continue;
    }
    seenNames.add(fullName);

    const cleanEmail = item.email.trim().toLowerCase() || null;
    const cleanCargo = item.cargo.trim();
    const areaType = getAreaType(cleanCargo);

    // 1. Cargar en tabla Personnel (Agendas)
    await prisma.personnel.create({
      data: {
        name: fullName,
        profession: cleanCargo.toUpperCase(),
        email: cleanEmail,
        type: areaType
      }
    });

    // 2. Cargar en tabla PersonalLogistica (Logística)
    await prisma.personalLogistica.create({
      data: {
        nombre: fullName,
        especialidad: cleanCargo,
        correo: cleanEmail,
        disponibilidad: true
      }
    });

    importedCount++;
  }

  console.log(`✅ ¡Importación masiva completada! Se insertaron ${importedCount} funcionarios únicos de forma exitosa.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error durante la importación masiva de fotos:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
