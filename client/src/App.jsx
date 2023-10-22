import {useEffect, useState} from 'react'
import './App.scss'
import { Chart } from "react-google-charts";

function App() {
    const [data, setData] = useState(null);

    useEffect(() => {
        refresh().then(r => {});
    }, []);

    const [buttonLabel, setButtonLabel] = useState('Refresh');

    const refresh = async () => {
        setButtonLabel('Refreshing...')
        const res = await fetch('https://wahlen.danphoton.com/api/robing');
        const data = await res.json();
        setData(data);
        setButtonLabel('Refresh');
    };

    if (data === null) return <>
        <p>Loading...</p>
    </>

    return (
        <>
            <h1>Resultate</h1>
            <p className={'summary'}>
                Timestamp: ${data.timestamp}
                <button onClick={refresh} className={(buttonLabel === 'Refreshing...' ? 'inactive' : '')}>{buttonLabel}</button>
            </p>
            <ul className={'cantonList'}>
                {
                    data.kantone.filter(kanton => kanton.vorlagen.length > 0).map(kanton => <Kanton canton={kanton} key={kanton.geoLevelnummer} />)
                }
            </ul>
        </>
    )
}

function Kanton({canton}) {
    return (
        <li>
            <h2>{canton.geoLevelname}</h2>
            <Staenderat vorlage={canton.vorlagen[1]} />
            <Nationalrat vorlage={canton.vorlagen[0]} />
        </li>
    );
}

function Staenderat({vorlage}) {
    return (
        <div>
            <h3>Ständerat</h3>
            <SmartTable noStripes={true} hideHead={true} data={vorlage.resultat.kandidaten.sort((a, b) => {
                return b.stimmen - a.stimmen;
            }).filter((candidate, i) => i < vorlage.anzahlSitze)} fields={[
                {
                    name: 'partei',
                    label: 'Partei',
                    type: 'computed',
                    defaultDirection: 1,
                    compute: (a) => a?.find(b => b.langKey === 'de')?.text ?? 'Unabhängig',
                },
                {
                    name: 'vorname',
                    label: 'Vorname',
                    type: 'string',
                    defaultDirection: 1,
                },
                {
                    name: 'nachname',
                    label: 'nachname',
                    type: 'string',
                    defaultDirection: 1,
                }
            ]} />
            <details>
                <summary>Kandidaten</summary>
                <SmartTable data={vorlage.resultat.kandidaten} defaultFieldIndex={3} fields={[
                    {
                        name: 'kandidatNummer',
                        label: '#',
                        type: 'number',
                        defaultDirection: 1,
                        parseInt: true,
                    },
                    {
                        name: 'vorname',
                        label: 'Vorname',
                        type: 'string',
                        defaultDirection: 1,
                    },
                    {
                        name: 'nachname',
                        label: 'Nachname',
                        type: 'string',
                        defaultDirection: 1,
                    },
                    {
                        name: 'stimmen',
                        label: 'Stimmen',
                        type: 'number',
                        defaultDirection: -1,
                    },
                    {
                        name: 'stimmenProzent',
                        label: 'Stimmen-%',
                        type: 'number',
                        defaultDirection: -1,
                        toFixed: 2,
                    },
                    {
                        name: 'prozentVomAbsolutenMehr',
                        label: 'Absolutes-Mehr-%',
                        type: 'number',
                        defaultDirection: -1,
                        toFixed: 2,
                    }
                ]} />
            </details>
        </div>
    );
}

function Nationalrat({vorlage}) {
    const getChartData = () => {
        if (vorlage.resultat.hochrechnung) {
            const parteien = vorlage.resultat.hochrechnung.parteien;
            const newData = [["Partei", "Sitze"], ...parteien.map(partei => {
                return [partei.parteiCode, partei.sitze];
            })];
            console.log(newData);
            const oldData = [["Partei", "Sitze"], ...parteien.map(partei => {
                return [partei.parteiCode, partei.sitze-partei.gewinnSitze];
            })];
            return {
                old: oldData,
                new: newData,
            };
        } else {
            const listen = vorlage.resultat.listen;
            let data = listen.filter(liste => liste.waehlerProzent >= 1.5).map(liste => {
                return [liste.listeCode, liste.waehler];
            });
            data = [["Liste", "Wähler"], ...data];
            return data;
        }
    };

    const chartOptions = {
        backgroundColor: '#000',
        chartArea: {
            top: 0,
            bottom: '40',
        },
        fontName: 'Rubik',
        legend: {
            textStyle: {
                color: 'white'
            }
        }
    };

    return (
        <div>
            <h3>Nationalrat</h3>
            <div>
                <Chart data={vorlage.resultat.hochrechnung ? false : getChartData()} diffdata={vorlage.resultat.hochrechnung ? getChartData() : false} chartType={'PieChart'} options={chartOptions} width={'100%'} height={'400px'} />
            </div>
            <details>
                <summary>Listen</summary>
                <SmartTable data={vorlage.resultat.listen} defaultFieldIndex={2} fields={[
                    {
                        name: 'listeNummer',
                        label: '#',
                        type: 'number',
                        defaultDirection: 1,
                    },
                    {
                        name: 'listeCode',
                        label: 'Liste',
                        type: 'string',
                        defaultDirection: 1,
                    },
                    {
                        name: 'waehler',
                        label: 'Wähler*innen',
                        type: 'number',
                        defaultDirection: -1,
                        toFixed: 0,
                    },
                    {
                        name: 'waehlerProzent',
                        label: 'Wähler*innen-%',
                        type: 'number',
                        defaultDirection: -1,
                        toFixed: 2,
                    },
                ]} />
            </details>
            <details>
                <summary>Ausgezählte Gemeinden {vorlage.gemeinden.filter(gemeinde => gemeinde.resultat.listenStimmenTotal).length}/{vorlage.gemeinden.length}</summary>
                <SmartTable data={vorlage.gemeinden.filter(gemeinde => gemeinde.resultat.listenStimmenTotal).map(gemeinde => {
                    return {
                        name: gemeinde.geoLevelname,
                        wahlbeteiligungInProzent: gemeinde.resultat.wahlbeteiligungInProzent,
                        wahlbeteiligungVeraenderung: gemeinde.resultat.wahlbeteiligungVeraenderung
                    };
                })} fields={[
                    {
                        name: "name",
                        label: "Gemeinde",
                        type: 'string',
                        defaultDirection: 1,
                    },
                    {
                        name: "wahlbeteiligungInProzent",
                        label: "Wahlbeteiligung",
                        type: 'number',
                        defaultDirection: -1,
                        unit: '%'
                    },
                    {
                        name: "wahlbeteiligungVeraenderung",
                        label: "Wahlbeteiligung Diff.",
                        type: 'number',
                        defaultDirection: -1,
                        unit: '%',
                        conditionalStyling: true,
                    },
                ]} />
            </details>
            <details>
                <summary>Nicht Ausgezählte Gemeinden {vorlage.gemeinden.filter(gemeinde => !gemeinde.resultat.listenStimmenTotal).length}/{vorlage.gemeinden.length}</summary>
                <SmartTable data={vorlage.gemeinden.filter(gemeinde => !gemeinde.resultat.listenStimmenTotal)} fields={[
                    {
                        name: "geoLevelname",
                        label: "Gemeinde",
                        type: 'string',
                        defaultDirection: 1,
                    },
                ]} />
            </details>
        </div>
    );
}

// field: {label: string, name: string, type: 'number' | 'string' | 'computed', defaultDirection: -1 | 1}
function SmartTable({data, fields, defaultFieldIndex = 0, hideHead = true, noStripes = false}) {
    const [orderedData, setOrderedData] = useState([]);
    const [orderBy, setOrderBy] = useState(fields[defaultFieldIndex]);

    useEffect(() => {
        if (orderBy === null) setOrderedData(data);
        const _data = [...data];
        if (orderBy.type === 'number') {
            _data.sort((a, b) => {
                return (a[orderBy.name] - b[orderBy.name]) * (orderBy.defaultDirection);
            });
        } else {
            _data.sort((a, b) => {
                const A = orderBy.type === 'computed' ? orderBy.compute(a[orderBy.name]) : a[orderBy.name];
                const B = orderBy.type === 'computed' ? orderBy.compute(b[orderBy.name]) : b[orderBy.name];
                if (A === B) return 0;
                if (A > B) return orderBy.defaultDirection;
                return orderBy.defaultDirection * -1;
            });
        }
        //console.log(_data);
        setOrderedData(_data);
    }, [data, fields, orderBy]);


    return (
        <table className={noStripes ? 'noStripes' : ''}>
            {
                !hideHead ? (
                    <thead>
                    <tr>
                        {
                            fields.map((field, i) => (
                                <th className={fields.length > 1 ? `clickable ${field.label === orderBy.label ? 'active' : ''}` : ''} onClick={() => setOrderBy(field)} key={i}>{field.label}</th>
                            ))
                        }
                    </tr>
                    </thead>
                ) : ''
            }
            <tbody>
            {
                orderedData.map((row, i) => (
                    <tr key={i}>
                        {
                            fields.map((field, i) => (
                                <td key={i} className={field.conditionalStyling && field.type === 'number' ? (parseFloat(row[field.name]) < 0 ? 'red' : 'green') : ''}>{field.type === 'number' ? ((field.parseInt ? parseInt(row[field.name]) : row[field.name]).toFixed(field.toFixed ?? 0)) : (field.type === 'computed' ? field.compute(row[field.name]) : row[field.name])}{field.unit ?? ''}</td>
                            ))
                        }
                    </tr>
                ))
            }
            </tbody>
        </table>
    );
}

export default App
