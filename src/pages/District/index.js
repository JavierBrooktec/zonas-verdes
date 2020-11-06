import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import ListItemText from '@material-ui/core/ListItemText';
import ListItem from '@material-ui/core/ListItem';
import { makeStyles } from '@material-ui/core/styles';

import { ThemeContext } from '../../App';

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

export default function District() {
  const [store, setMystore] = useContext(ThemeContext);
  const [imageBG, setimageBG] = useState('');

  useEffect(() => {
    let doc = sym('http://api.zonasVerdesMadrid.com');
    setMystore(
      '<http://api.zonasverdesmadrid.com/resources/districts/Centro> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://api.zonasVerdesMadrid.com/ontologies#district>.',
      doc.uri,
      'text/n3'
    );
  }, []);
  const ONT = new Namespace('http://api.zonasVerdesMadrid.com/ontologies/');
  const OWL = new Namespace('http://www.w3.org/2002/07/owl');
  const DBONT = new Namespace('http://dbpedia.org/ontology/');
  const DBPROP = new Namespace('http://dbpedia.org/property/');

  const { districtId } = useParams();

  const [loading, setloading] = useState(true);

  const myDistrict = store
    .match(null, ONT('districts#hasName'), districtId)
    .map(({ subject, predicate, object }, i) => ({ subject, object }));
  const newMyDistrictInfo = myDistrict.map(({ subject, object }) => {
    const dbpediaLink = store.any(sym(subject.value), OWL('#sameAs'), null);
    const heigthAverage = store.any(sym(subject.value), ONT('districts#hasHeightAverage'), null);
    const perimeterAverage = store.any(sym(subject.value), ONT('districts#hasPerimeterAverage'), null);
    const justPlanted = store.any(sym(subject.value), ONT('districts#hasJustPlanted'), null);
    const young = store.any(sym(subject.value), ONT('districts#hasYoung'), null);
    const mature = store.any(sym(subject.value), ONT('districts#hasMature'), null);
    const old = store.any(sym(subject.value), ONT('districts#hasOld'), null);
    const others = store.any(sym(subject.value), ONT('districts#hasOthers'), null);


    return {
      districtUri: subject.value,
      districtName: unescape(object.value),
      dbpediaLink: dbpediaLink?.value,
      heigthAverage: heigthAverage?.value,
      perimeterAverage: perimeterAverage?.value,
      justPlanted: justPlanted?.value,
      young: young?.value,
      mature: mature?.value,
      old: old?.value,
      others: others?.value,
    };
  });

  console.log(newMyDistrictInfo[0].districtUri);

  const treeList = store
    .match(
      sym(newMyDistrictInfo[0].districtUri),
      ONT('districts#hasSpecies'),
      null
    )
    .map(({ subject, predicate, object }, i) => {

      const er = /[^\/]+(?=\/$|$)/;
      const ermacth = object.value.match(er)[0];

      const numberofThisSpecie = store.any(
        sym(newMyDistrictInfo[0].districtUri),
        ONT(`species#hasUnits${ermacth}`),
        null
      );

      const urlofThisSpecie = store.any(
        sym(object.value),
        OWL(`#sameAs`),
        null
      );

      console.log(object.value);
      console.log(OWL(`#sameAs`));
      console.log(urlofThisSpecie);

      return {
        especieName: ermacth,
        number: numberofThisSpecie?.value,
        url: urlofThisSpecie?.value
      };
    });

  console.log(treeList);

  const fetcher = new Fetcher(store);
  const districtUrl = sym(`${newMyDistrictInfo[0].dbpediaLink}`);
  const profile = districtUrl.doc();

  // lamada asinncorona que se llama solo al crear el componente
  useEffect(() => {
    fetcher.load(profile).then(
      (response) => {
        const root = htmlParser(response.responseText);
        // buscamos los links dentro de los metadatos.
        const matched = root
          .querySelectorAll('head link')
          .filter((el) => el.getAttribute('type') === 'text/n3');

        const n3Link = matched[0].getAttribute('href');

        // request del archivo
        fetch(n3Link)
          .then((response) => response.text())
          .then((data) => {
            let doc = sym('http://dbpedia.org/data');
            // jsonParser(data, 'http://dbpedia.org/data', store);
            setMystore(data, doc.uri, 'text/n3');
            // metemos el archivo en nuestra store
            // jsonParserFixed(data, 'http://dbpedia.org/data', store);

            // cuando lo hemos recibido cambiamos el estado a notLoading
            setloading(false);
            const imageDistrict = store
              .match(
                sym(newMyDistrictInfo[0].districtUri),
                DBPROP('imageMap'),
                null
              )
              .map(({ subject, predicate, object }, i) => object.value);

            fetch('https://commons.wikimedia.org/wiki/File:' + imageDistrict[0])
              .then((response) => response.text())
              .then((res) => {
                console.log(res);
              });

            // setimageBG(imageDistrict[0]);
          }); // pass base URI);
      },
      (err) => {}
    );
  }, []);

  // machear la store entera y pintarla

  const descriptionDistrict = store
    .match(sym(newMyDistrictInfo[0].districtUri), DBONT('abstract'), null)
    .filter(({ object }) => object?.language === 'es')
    .map(({ subject, predicate, object }, i) => <p key={i}>{object.value}</p>);
    
      
  const useStyles = makeStyles((theme) => ({
    root: {
      flexGrow: 1,
      maxWidth: 752,
    },
    demo: {
      backgroundColor: '#ffffff',
      color: '#026e00',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: 'contain',
    },
    title: {
      margin: theme.spacing(4, 0, 2),
    },
  }));

  const classes = useStyles();

  console.log(imageBG);
  return (
    <div>
      <h3>{districtId}</h3>
      {descriptionDistrict[0]}
      {newMyDistrictInfo[0].heigthAverage}
      {newMyDistrictInfo[0].perimeterAverage}
      {newMyDistrictInfo[0].justPlanted}
      {newMyDistrictInfo[0].young}
      {newMyDistrictInfo[0].mature}
      {newMyDistrictInfo[0].old}
      {newMyDistrictInfo[0].others}
      <div
        className={classes.demo}
        style={{
          backgroundImage: `url('https://commons.wikimedia.org/wiki/File:${imageBG.replace(
            /\s/g,
            '_'
          )}')`,
        }}
      >
        <List dense={true} secondary={true}>
          {treeList.map(({ especieName, number, url }, i) => (
            <React.Fragment key={`${especieName}-${i}`}>
              <ListItem>
                <ListItem>
                  <a href={url}><ListItemText primary={especieName} secondary={number} /></a>
                </ListItem>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </div>
    </div>
  );
}
