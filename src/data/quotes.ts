export interface Quote {
  text: string;
  source: string;
}

export const quotesEs: Quote[] = [
  {
    text: "En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor.",
    source: "Miguel de Cervantes, Don Quijote de la Mancha",
  },
  {
    text: "El mundo era tan reciente, que muchas cosas carecían de nombre, y para mencionarlas había que señalarlas con el dedo.",
    source: "Gabriel García Márquez, Cien años de soledad",
  },
  {
    text: "No hay barrera, cerradura ni cerrojo que puedas imponer a la libertad de mi mente.",
    source: "Virginia Woolf, Una habitación propia",
  },
  {
    text: "Es una verdad mundialmente reconocida que un hombre soltero, poseedor de una gran fortuna, necesita una esposa.",
    source: "Jane Austen, Orgullo y prejuicio",
  },
  {
    text: "Llamadme Ismael. Hace unos años -no importa cuántos exactamente-, teniendo poco o ningún dinero en el bolsillo, y nada en particular que me interesara en tierra, pensé que me iría a navegar un poco por ahí, para ver la parte acuática del mundo.",
    source: "Herman Melville, Moby Dick",
  },
  {
    text: "Era el mejor de los tiempos, era el peor de los tiempos, la edad de la sabiduría, y también de la locura; la época de las creencias y de la incredulidad; la era de la luz y de las tinieblas.",
    source: "Charles Dickens, Historia de dos ciudades",
  },
  {
    text: "La alegría de ver y entender es el más perfecto don de la naturaleza.",
    source: "Albert Einstein",
  },
  {
    text: "El misterio de la vida no es un problema a resolver, sino una realidad a experimentar.",
    source: "Frank Herbert, Dune",
  },
  {
    text: "Todo lo que tenemos que decidir es qué hacer con el tiempo que se nos ha dado.",
    source: "J.R.R. Tolkien, El Señor de los Anillos",
  },
  {
    text: "Me pregunto si las estrellas se iluminan con el fin de que algún día, cada uno pueda encontrar la suya.",
    source: "Antoine de Saint-Exupéry, El Principito",
  },
  {
    text: "Solo los que arriesgan yendo muy lejos pueden encontrar lo lejos que pueden llegar.",
    source: "T.S. Eliot",
  },
  {
    text: "La verdadera nobleza consiste en ser superior a tu antiguo yo.",
    source: "Ernest Hemingway",
  },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getRandomQuote(language: "es" | "en" = "es"): Quote {
  const list = quotesEs; // Si en el futuro añadimos inglés, se cambia aquí
  return list[Math.floor(Math.random() * list.length)];
}
