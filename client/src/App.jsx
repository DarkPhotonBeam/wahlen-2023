import {useEffect, useState} from 'react'
import './App.scss'

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

function Gemeinde() {

}

function Staenderat({vorlage}) {
    return (
        <div>
            <h3>Ständerat</h3>
            <details>
                <summary>Kandidaten</summary>
                <SmartTable data={vorlage.resultat.kandidaten} fields={[
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
    return (
        <div>
            <h3>Nationalrat</h3>
            <details>
                <summary>Listen</summary>
                <SmartTable data={vorlage.resultat.listen} fields={[
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
                        toFixed: 2,
                    },
                    {
                        name: 'waehlerProzent',
                        label: 'Wähler*innen-%',
                        type: 'number',
                        defaultDirection: -1,
                        toFixed: 2,
                    }
                ]} />
            </details>
            <details>
                <summary>Ausgezählte Gemeinden {vorlage.gemeinden.filter(gemeinde => gemeinde.resultat.listenStimmenTotal).length}/{vorlage.gemeinden.length}</summary>
                {/*<ul className={'gemeinden'}>*/}
                {/*    {*/}
                {/*        vorlage.gemeinden.filter(gemeinde => gemeinde.resultat.listenStimmenTotal).map((gemeinde, i) => (*/}
                {/*            <li key={i}>{gemeinde.geoLevelname}</li>*/}
                {/*        ))*/}
                {/*    }*/}
                {/*</ul>*/}
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
        </div>
    );
}

function Listen({lists}) {
    const [_lists, setLists] = useState([]);
    const [orderBy, setOrderBy] = useState('listeNummer');

    useEffect(() => {
        const sortedList = [...lists];
        sortedList.sort((a, b) => {
            return (a[orderBy]-b[orderBy]) * (orderBy === 'listeNummer' ? 1 : -1);
        });
        setLists(sortedList);
    }, [lists, orderBy]);

    return (
        <table className={'listen'}>
            <thead>
                <tr>
                    <th className={(orderBy === 'listeNummer' ? 'active' : '') + " clickable"} onClick={() => setOrderBy('listeNummer')}>#</th><th>Listencode</th><th className={(orderBy !== 'listeNummer' ? 'active' : '') + " clickable"} onClick={() => setOrderBy('waehler')}>Wähler*innen</th><th className={(orderBy !== 'listeNummer' ? 'active' : '') + " clickable"} onClick={() => setOrderBy('waehler')}>Wähler*innen-%</th>
                </tr>
            </thead>
            <tbody>
            {
                _lists.map(list => <Liste list={list} key={list.listeNummer} />)
            }
            </tbody>
        </table>
    );
}
// field: {label: string, name: string, type: 'number' | 'string', defaultDirection: -1 | 1}
function SmartTable({data, fields}) {
    const [orderedData, setOrderedData] = useState([]);
    const [orderBy, setOrderBy] = useState(fields[0]);

    useEffect(() => {
        if (orderBy === null) setOrderedData(data);
        const _data = [...data];
        if (orderBy.type === 'number') {
            _data.sort((a, b) => {
                return (a[orderBy.name] - b[orderBy.name]) * (orderBy.defaultDirection);
            });
        } else {
            _data.sort((a, b) => {
                const A = a[orderBy.name];
                const B = b[orderBy.name];
                if (A === B) return 0;
                if (A > B) return orderBy.defaultDirection;
                return orderBy.defaultDirection * -1;
            });
        }
        console.log(_data);
        setOrderedData(_data);
    }, [data, fields, orderBy]);


    return (
        <table>
            <thead>
                <tr>
                    {
                        fields.map((field, i) => (
                            <th className={`clickable ${field.name === orderBy.name ? 'active' : ''}`} onClick={() => setOrderBy(field)} key={i}>{field.label}</th>
                        ))
                    }
                </tr>
            </thead>
            <tbody>
            {
                orderedData.map((row, i) => (
                    <tr key={i}>
                        {
                            fields.map((field, i) => (
                                <td key={i} className={field.conditionalStyling && field.type === 'number' ? (parseFloat(row[field.name]) < 0 ? 'red' : 'green') : ''}>{field.type === 'number' ? ((field.parseInt ? parseInt(row[field.name]) : row[field.name]).toFixed(field.toFixed ?? 0)) : row[field.name]}{field.unit ?? ''}</td>
                            ))
                        }
                    </tr>
                ))
            }
            </tbody>
        </table>
    );
}

function Liste({list}) {
    return (
        <tr>
            <td>{list.listeNummer}</td><td>{list.listeCode}</td><td>{list.waehler.toFixed(0)}</td><td>{list.waehlerProzent.toFixed(2)}</td>
        </tr>
    );
}

export default App
