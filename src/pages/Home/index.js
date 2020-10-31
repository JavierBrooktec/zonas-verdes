import React, { useEffect, useState } from 'react';
import { jsonParserFixed } from '../../helpers/fixes';

import {
  graph,
  Namespace,
  Fetcher,
  parse,
  sym,
  //   serialize,
  //   jsonParser,
} from 'rdflib';
import { parse as htmlParser } from 'node-html-parser';

export default function Home() {
  // creamos una store
  const [store, setstore] = useState(graph());

  const me = sym('https://example.com/alice/card#me');
  const alice = sym('https://example.com/alice/card#alice');

  // crear nameSpaces
  const VCARD = new Namespace('http://www.w3.org/2006/vcard/ns#');
  const FOAF = new Namespace('http://xmlns.com/foaf/0.1/');

  // solo  queremos que se añadan la primera vez
  useEffect(() => {
    store.add(me, VCARD('name'), 'Javi');
    store.add(me, VCARD('name'), alice);
    store.add(alice, VCARD('hasNickname'), 'Alicia777');
  }, []);

  // añadir tripletas

  // retornar tripletas
  let nameMatch = store.match(me, VCARD('name'), null);
  console.log(`nameMatch: ${nameMatch}`);

  // retornar primer match
  let name = store.any(me, VCARD('name'));
  console.log(`name: ${name}`);

  // añadir al store tripletas desde texto (no añade duplicados)
  let text = '<#this>  a  <#Example> .';
  let doc = sym('https://example.com/alice/card');
  parse(text, store, doc.uri); // pass base URI

  // macheme tripletas donde alice sea sujeto o objeto.
  let aliceMatchers = [
    ...store.match(alice, null, null, null).map((st) => st),
    ...store.match(null, null, alice, null).map((st) => st),
  ];

  console.log('ALICE MATCHERS');
  aliceMatchers.forEach(({ subject, predicate, object }) =>
    console.log(`${subject.value} ${predicate.value} ${object.value}`)
  );

  // vamos a buscar información sobre el pino en dbpedia

  // no la tenemos
  const [loading, setloading] = useState(true);

  const fetcher = new Fetcher(store);
  const pinus = sym('http://dbpedia.org/page/Pine');
  const profile = pinus.doc();

  // lamada asinncorona que se llama solo al crear el componente
  useEffect(() => {
    fetcher.load(profile).then(
      (response) => {
        const root = htmlParser(response.responseText);
        // buscamos los links dentro de los metadatos.
        const matched = root
          .querySelectorAll('head link')
          .filter((el) => el.getAttribute('type') === 'application/json');

        const jsonLink = matched[0].getAttribute('href');

        // request del archivo
        fetch(jsonLink)
          .then((response) => response.json())
          .then((data) => {
            // jsonParser(data, 'http://dbpedia.org/data', store);

            // metemos el archivo en nuestra store
            jsonParserFixed(data, 'http://dbpedia.org/data', store);

            // cuando lo hemos recibido cambiamos el estado a notLoading
            setloading(false);
          }); // pass base URI);
      },
      (err) => {}
    );
  }, []);

  // machear la store entera y pintarla
  const myStore = store
    .match(null, null, null, null)
    .map(({ subject, predicate, object }, i) => (
      <p key={i}>
        {subject.value} {predicate.value} {object.value}
      </p>
    ));

  return (
    <div>
      <h1>Hellow from home!</h1>
      {loading ? <p>loading</p> : myStore}
    </div>
  );
}
