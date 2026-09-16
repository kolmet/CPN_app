// Normes d'ús transcrites dels documents "normes provisionals" de cada
// espai, amb la icona corresponent de cada punt (com al cartell). Edita
// aquest fitxer quan canviïn les normes reals — no cal tocar cap altre
// component.
export const SPACE_RULES = {
  bugaderia: {
    title: "Espai Bugaderies i Estenedors",
    items: [
      { icon: "calendar", text: "Fem servir el sistema de reserves." },
      { icon: "washer", text: "Cuidem el material i els electrodomèstics." },
      { icon: "basket", text: "Recollida puntual de la roba de rentadores, assecadors i estenedors." },
      { icon: "clothespin", text: "No deixem estris desendreçats (cossis, pinces, roba, carro, pot de sabó, etc.)." },
      { icon: "basket", text: "Deixem l'espai per tornar a ser usat." },
      { icon: "clock", text: "Horari d'ús de 8h a 22h." },
      { icon: "speech", text: "Davant d'un conflicte d'usos, prioritzem el diàleg." },
      { icon: "people", text: "Totes som responsables de cuidar aquest espai." },
    ],
  },
  hostes: {
    title: "Espai d'Habitacions de Convidades",
    items: [
      { icon: "door", text: "Tinguem cura del mobiliari. És de totes! Fem-ne un ús responsable i comuniquem qualsevol incidència." },
      { icon: "broom", text: "Deixem l'espai, recollit, net i endreçat." },
      { icon: "washer", text: "Netegem la roba que es faci servir i posem-ne de neta." },
      { icon: "nosmoking", text: "Les habitacions de convidades són espais sense fum." },
      { icon: "calendar", text: "Fem servir el sistema de reserves." },
      { icon: "nodog", text: "No hi poden accedir animals." },
      { icon: "people", text: "Totes som responsables de cuidar aquest espai." },
    ],
  },
  polivalent: {
    title: "Espai Polivalent",
    items: [
      { icon: "people", text: "Respectem totes les activitats que s'hi fan." },
      { icon: "clock", text: "Respectem els horaris i el volum." },
      { icon: "sparkle", text: "Deixem l'espai com ens agradaria trobar-lo." },
      { icon: "chair", text: "Cuidem el material i el mobiliari." },
      { icon: "calendar", text: "Fem servir el sistema de reserves." },
      { icon: "speech", text: "Davant d'un conflicte d'usos, prioritzem el diàleg." },
      { icon: "nosmoking", text: "La sala és un espai sense fum." },
      { icon: "nodog", text: "No hi poden accedir animals amb pèl." },
      { icon: "people", text: "Totes som responsables de cuidar aquest espai." },
    ],
  },
  // ⚠️ Provisional: no ens vas passar un document per a aquest espai, així
  // que he adaptat el mateix to i estructura dels altres tres. Revisa-ho i
  // canvia el text per l'oficial quan el tingueu.
  moviment: {
    title: "Sala de Cos i Moviment",
    items: [
      { icon: "people", text: "Respectem l'activitat que s'hi fa i el silenci si algú ho necessita." },
      { icon: "clock", text: "Respectem els horaris reservats." },
      { icon: "broom", text: "Deixem l'espai net i endreçat, com ens agradaria trobar-lo." },
      { icon: "movement", text: "Cuidem el material i el terra (parquet)." },
      { icon: "barefoot", text: "No es pot entrar amb sabatilles." },
      { icon: "calendar", text: "Fem servir el sistema de reserves." },
      { icon: "speech", text: "Davant d'un conflicte d'usos, prioritzem el diàleg." },
      { icon: "nosmoking", text: "És un espai sense fum." },
      { icon: "nodog", text: "No hi poden accedir animals amb pèl." },
      { icon: "people", text: "Totes som responsables de cuidar aquest espai." },
    ],
  },
  // ⚠️ Provisional: cap document rebut per a aquest espai. Revisa-ho i
  // canvia el text per l'oficial quan el tingueu.
  bicicletes: {
    title: "Bicicletes",
    items: [
      { icon: "calendar", text: "Fem servir el sistema de reserves, indicant sempre la franja horària d'ús." },
      { icon: "clock", text: "Retornem la bicicleta puntualment en acabar la franja reservada." },
      { icon: "battery", text: "Carreguem la bateria quan s'estigui esgotant, per deixar-la llesta per a la següent persona." },
      { icon: "lock", text: "Guardem sempre la bicicleta amb cadenat." },
      { icon: "bike", text: "Si alguna cosa no funciona bé, cal comunicar-ho perquè es pugui reparar." },
      { icon: "speech", text: "Davant d'un conflicte d'usos, prioritzem el diàleg." },
      { icon: "people", text: "Totes som responsables de cuidar aquest espai." },
    ],
  },
  // ⚠️ Provisional: cap document rebut per a aquest espai. Revisa-ho i
  // canvia el text per l'oficial quan el tingueu.
  taller: {
    title: "Taller",
    items: [
      { icon: "calendar", text: "Fem servir el sistema de reserves, indicant sempre la franja horària d'ús." },
      { icon: "broom", text: "Deixem l'espai net i endreçat en acabar, retirant les restes de material." },
      { icon: "chair", text: "Cuidem les eines i el mobiliari, i les tornem al seu lloc." },
      { icon: "washer", text: "Comuniquem qualsevol eina espatllada o incidència perquè es pugui reparar." },
      { icon: "speech", text: "Davant d'un conflicte d'usos, prioritzem el diàleg." },
      { icon: "people", text: "Totes som responsables de cuidar aquest espai." },
    ],
  },
  // ⚠️ Provisional: cap document rebut per a aquest espai. Revisa-ho i
  // canvia el text per l'oficial quan el tingueu.
  terrasses: {
    title: "Terrasses",
    items: [
      { icon: "calendar", text: "Fem servir el sistema de reserves, indicant sempre la franja horària d'ús." },
      { icon: "clock", text: "Respectem els horaris i el volum, sobretot a les nits." },
      { icon: "broom", text: "Deixem l'espai net i endreçat en acabar." },
      { icon: "nosmoking", text: "Si es fuma, es fa lluny de finestres i portes obertes, i es recullen les puntes." },
      { icon: "speech", text: "Davant d'un conflicte d'usos, prioritzem el diàleg." },
      { icon: "people", text: "Totes som responsables de cuidar aquest espai." },
    ],
  },
};
